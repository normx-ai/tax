import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/keycloak-auth';
import { resolveTenant, requireOrg } from '../middleware/tenant.middleware';
import { requireOwner } from '../middleware/orgRole.middleware';
import { validate } from '../middleware/validate.middleware';
import { activateBody, upgradeBody } from '../schemas/subscription.schema';
import * as subscriptionService from '../services/subscription.service';
import { AuditService } from '../services/audit.service';
import { getClientIp } from '../utils/ip';
import prisma from '../utils/prisma';
import { createLogger } from '../utils/logger';

const logger = createLogger('SubscriptionRoutes');
const router = Router();

/**
 * @swagger
 * /api/subscription:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Statut de l'abonnement
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Détails de l'abonnement
 *       404:
 *         description: Abonnement introuvable
 */
// GET /api/subscription — status de l'abonnement
router.get('/', requireAuth, resolveTenant, requireOrg, async (req: AuthRequest, res: Response) => {
  try {
    const sub = await subscriptionService.getSubscription(req.orgId!);
    res.json(sub);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    if (msg.includes('introuvable')) { res.status(404).json({ error: msg }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/subscription/activate:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Activer un plan payant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan:
 *                 type: string
 *                 example: PRO
 *     responses:
 *       200:
 *         description: Abonnement activé
 *       400:
 *         description: Plan invalide
 */
// POST /api/subscription/activate — Activation manuelle après paiement (OWNER only)
router.post('/activate', requireAuth, resolveTenant, requireOrg, requireOwner, validate({ body: activateBody }), async (req: AuthRequest, res: Response) => {
  try {
    const { plan } = req.body;

    // Quand l'OWNER active lui-même, les sièges = nombre de membres actuels (minimum 1)
    const memberCount = await prisma.organizationMember.count({ where: { organizationId: req.orgId! } });
    const paidSeats = Math.max(memberCount, 1);
    const updated = await subscriptionService.activateSubscription(req.orgId!, plan, paidSeats);

    AuditService.log({
      actorId: req.userId!,
      actorEmail: req.userEmail!,
      action: 'SUBSCRIPTION_CREATED',
      entityType: 'Subscription',
      entityId: updated.id,
      organizationId: req.orgId!,
      ipAddress: getClientIp(req),
      changes: { plan, activatedUntil: updated.currentPeriodEnd },
    });

    res.json({
      message: `Abonnement ${plan} activé pour 1 an`,
      subscription: updated,
    });
  } catch (err) {
    logger.error('Erreur activation abonnement', err);
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    if (msg.includes('introuvable') || msg.includes('gratuit')) { res.status(400).json({ error: msg }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/subscription/renew:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Renouveler l'abonnement
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Abonnement renouvelé
 *       400:
 *         description: Renouvellement impossible
 */
// POST /api/subscription/renew — Renouvellement après paiement (OWNER only)
router.post('/renew', requireAuth, resolveTenant, requireOrg, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await subscriptionService.renewSubscription(req.orgId!);

    AuditService.log({
      actorId: req.userId!,
      actorEmail: req.userEmail!,
      action: 'SUBSCRIPTION_UPDATED',
      entityType: 'Subscription',
      entityId: updated.id,
      organizationId: req.orgId!,
      ipAddress: getClientIp(req),
      changes: { action: 'renew', renewedUntil: updated.currentPeriodEnd },
    });

    res.json({
      message: 'Abonnement renouvelé pour 1 an',
      subscription: updated,
    });
  } catch (err) {
    logger.error('Erreur renouvellement', err);
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    if (msg.includes('introuvable') || msg.includes('gratuit')) { res.status(400).json({ error: msg }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/subscription/upgrade:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Changer de plan (upgrade)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan:
 *                 type: string
 *                 example: PRO
 *     responses:
 *       200:
 *         description: Plan mis à jour
 *       400:
 *         description: Upgrade impossible
 *       404:
 *         description: Abonnement introuvable
 */
// POST /api/subscription/upgrade — Changer de plan
router.post('/upgrade', requireAuth, resolveTenant, requireOrg, requireOwner, validate({ body: upgradeBody }), async (req: AuthRequest, res: Response) => {
  try {
    const updated = await subscriptionService.upgradePlan(req.orgId!, req.body.plan);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'SUBSCRIPTION_UPDATED', entityType: 'Subscription', entityId: updated.id, organizationId: req.orgId!, ipAddress: getClientIp(req), changes: { newPlan: req.body.plan } });
    res.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    if (msg.includes('introuvable')) { res.status(404).json({ error: msg }); return; }
    if (msg.includes('supérieur') || msg.includes('déjà')) { res.status(400).json({ error: msg }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/subscription/quota:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Vérifier le statut du quota
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut du quota
 *       404:
 *         description: Abonnement introuvable
 */
// GET /api/subscription/quota — Statut du quota
router.get('/quota', requireAuth, resolveTenant, requireOrg, async (req: AuthRequest, res: Response) => {
  try {
    const quota = await subscriptionService.checkQuota(req.orgId!, req.userId);
    res.json(quota);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    if (msg.includes('introuvable')) { res.status(404).json({ error: msg }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
