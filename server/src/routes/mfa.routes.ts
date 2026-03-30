import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireAuth, AuthRequest } from '../middleware/keycloak-auth';
import { isWebClient, setAuthCookies } from '../middleware/auth';
import { sensitiveLimiter, authLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { enableMfaBody, disableMfaBody, verifyMfaBody } from '../schemas/mfa.schema';
import { MFAService } from '../services/mfa.service';
import { MFABackupService } from '../services/mfa.backup.service';
import { AuditService } from '../services/audit.service';
import { EmailService } from '../services/email.service';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import prisma from '../utils/prisma';
import { createLogger } from '../utils/logger';
import { getClientIp } from '../utils/ip';

const logger = createLogger('MFARoutes');
const router = Router();

/**
 * @swagger
 * /mfa/status:
 *   get:
 *     tags: [MFA]
 *     summary: Obtenir le statut MFA de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut MFA retourné
 *       400:
 *         description: Erreur lors de la récupération du statut
 *       401:
 *         description: Non authentifié
 */
// GET /api/mfa/status
router.get('/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const status = await MFAService.getStatus(req.userId!);
    res.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    res.status(400).json({ error: message });
  }
});

/**
 * @swagger
 * /mfa/setup:
 *   post:
 *     tags: [MFA]
 *     summary: Générer la configuration MFA (QR code et secret)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration MFA générée (QR code + secret)
 *       400:
 *         description: Erreur lors de la génération
 *       401:
 *         description: Non authentifié
 */
// POST /api/mfa/setup
router.post('/setup', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await MFAService.generateSetup(req.userId!);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    res.status(400).json({ error: message });
  }
});

/**
 * @swagger
 * /mfa/enable:
 *   post:
 *     tags: [MFA]
 *     summary: Activer le MFA avec un code TOTP
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Code TOTP généré par l'application d'authentification
 *     responses:
 *       200:
 *         description: MFA activé, codes de secours retournés
 *       400:
 *         description: Code TOTP manquant ou invalide
 *       401:
 *         description: Non authentifié
 */
// POST /api/mfa/enable
router.post('/enable', requireAuth, sensitiveLimiter, validate({ body: enableMfaBody }), async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;

    const result = await MFAService.enable(req.userId!, code);

    AuditService.log({
      actorId: req.userId!,
      actorEmail: req.userEmail!,
      action: 'MFA_ENABLED',
      entityType: 'USER',
      entityId: req.userId!,
      ipAddress: getClientIp(req),
      changes: { mfaEnabled: true },
    });

    EmailService.sendMfaEnabled(req.userEmail!).catch((err) => {
      logger.error(`Echec envoi email MFA à ${req.userEmail}`, err);
    });

    res.json({
      message: 'MFA activé avec succès',
      backupCodes: result.backupCodes,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    res.status(400).json({ error: message });
  }
});

/**
 * @swagger
 * /mfa/disable:
 *   post:
 *     tags: [MFA]
 *     summary: Désactiver le MFA avec confirmation par mot de passe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 description: Mot de passe de l'utilisateur pour confirmation
 *     responses:
 *       200:
 *         description: MFA désactivé
 *       400:
 *         description: Mot de passe manquant ou MFA non activé
 *       401:
 *         description: Non authentifié ou mot de passe incorrect
 */
// POST /api/mfa/disable
router.post('/disable', requireAuth, sensitiveLimiter, validate({ body: disableMfaBody }), async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { password: true, mfaEnabled: true },
    });

    if (!user?.mfaEnabled) {
      res.status(400).json({ error: 'MFA non activé' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Mot de passe incorrect' });
      return;
    }

    await MFAService.disable(req.userId!);

    AuditService.log({
      actorId: req.userId!,
      actorEmail: req.userEmail!,
      action: 'MFA_DISABLED',
      entityType: 'USER',
      entityId: req.userId!,
      ipAddress: getClientIp(req),
      changes: { mfaEnabled: false },
    });

    res.json({ message: 'MFA désactivé' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    res.status(400).json({ error: message });
  }
});

/**
 * @swagger
 * /mfa/verify:
 *   post:
 *     tags: [MFA]
 *     summary: Vérification MFA pendant le login (public avec rate limit)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mfaToken, code]
 *             properties:
 *               mfaToken:
 *                 type: string
 *                 description: Token MFA temporaire reçu après verify-otp
 *               code:
 *                 type: string
 *                 description: Code TOTP ou code de secours
 *     responses:
 *       200:
 *         description: MFA vérifié, tokens d'authentification retournés
 *       400:
 *         description: mfaToken et code requis
 *       401:
 *         description: Token MFA invalide, expiré ou code MFA invalide
 *       500:
 *         description: Erreur serveur
 */
// POST /api/mfa/verify (pendant le login, public avec authLimiter)
router.post('/verify', authLimiter, validate({ body: verifyMfaBody }), async (req: AuthRequest, res: Response) => {
  try {
    const { mfaToken, code } = req.body;

    // Décoder le mfaToken temporaire
    let payload: { userId: string; email: string; mfa: boolean };
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        logger.error("JWT_SECRET manquant — impossible de vérifier le token MFA");
        res.status(500).json({ error: "Configuration serveur invalide" });
        return;
      }
      payload = jwt.verify(mfaToken, secret) as typeof payload;
    } catch {
      res.status(401).json({ error: 'Token MFA invalide ou expiré' });
      return;
    }

    if (!payload.mfa) {
      res.status(401).json({ error: 'Token MFA invalide' });
      return;
    }

    const isValid = await MFAService.verifyLogin(payload.userId, code);
    if (!isValid) {
      res.status(401).json({ error: 'Code MFA invalide' });
      return;
    }

    // Générer les vrais tokens
    const token = generateAccessToken({ userId: payload.userId, email: payload.email });
    const refreshToken = generateRefreshToken({ userId: payload.userId, email: payload.email });

    await prisma.user.update({
      where: { id: payload.userId },
      data: { lastLoginAt: new Date() },
    });

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: payload.userId },
      include: { organization: true },
    });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    AuditService.log({
      actorId: payload.userId,
      actorEmail: payload.email,
      action: 'LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: payload.userId,
      ipAddress: getClientIp(req),
      changes: null,
      metadata: { mfa: true },
    });

    const responseBody = {
      user: {
        id: payload.userId,
        nom: user?.lastName,
        prenom: user?.firstName,
        email: payload.email,
        role: membership?.role,
        entreprise_id: membership?.organizationId,
        entreprise_nom: membership?.organization.name,
        is_verified: true,
      },
    };

    if (isWebClient(req)) {
      // Web : cookies httpOnly — pas de tokens dans le body
      setAuthCookies(res, token, refreshToken);
      res.json(responseBody);
    } else {
      // Mobile : tokens dans le body
      res.json({ ...responseBody, token, refreshToken });
    }
  } catch (err: unknown) {
    logger.error('[mfa-verify]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /mfa/backup-codes/regenerate:
 *   post:
 *     tags: [MFA]
 *     summary: Régénérer les codes de secours MFA
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nouveaux codes de secours générés
 *       400:
 *         description: MFA non activé
 *       401:
 *         description: Non authentifié
 */
// POST /api/mfa/backup-codes/regenerate
router.post('/backup-codes/regenerate', requireAuth, sensitiveLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { mfaEnabled: true },
    });

    if (!user?.mfaEnabled) {
      res.status(400).json({ error: 'MFA non activé' });
      return;
    }

    const backupCodes = await MFABackupService.generateBackupCodes(req.userId!);

    AuditService.log({
      actorId: req.userId!,
      actorEmail: req.userEmail!,
      action: 'MFA_BACKUP_REGENERATED',
      entityType: 'USER',
      entityId: req.userId!,
      ipAddress: getClientIp(req),
      changes: { regenerated: true },
    });

    res.json({
      message: 'Codes de secours régénérés',
      backupCodes,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    res.status(400).json({ error: message });
  }
});

export default router;
