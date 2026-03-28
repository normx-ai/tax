import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/keycloak-auth';
import { resolveTenant, requireOrg } from '../middleware/tenant.middleware';
import { requireOwner, requireAdmin } from '../middleware/orgRole.middleware';
import { validate } from '../middleware/validate.middleware';
import { grantPermissionBody, revokePermissionBody } from '../schemas/permission.schema';
import { userIdParam } from '../schemas/common.schema';
import * as permissionService from '../services/permission.service';
import { AuditService } from '../services/audit.service';
import { getClientIp } from '../utils/ip';
import { Permission } from '../types/permissions';

const router = Router();

function handleError(res: Response, err: unknown) {
  const msg = err instanceof Error ? err.message : 'Erreur serveur';
  if (msg.includes('introuvable')) { res.status(404).json({ error: msg }); return; }
  if (msg.includes('propriétaire')) { res.status(400).json({ error: msg }); return; }
  res.status(500).json({ error: 'Erreur serveur' });
}

/**
 * @swagger
 * /api/permissions/available:
 *   get:
 *     tags: [Permissions]
 *     summary: Lister les permissions disponibles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des permissions disponibles
 */
// GET /api/permissions/available
router.get('/available', requireAuth, async (_req: AuthRequest, res: Response) => {
  res.json(permissionService.listAvailable());
});

/**
 * @swagger
 * /api/permissions/my:
 *   get:
 *     tags: [Permissions]
 *     summary: Obtenir mes permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions de l'utilisateur courant
 */
// GET /api/permissions/my — mes permissions
router.get('/my', requireAuth, resolveTenant, requireOrg, async (req: AuthRequest, res: Response) => {
  try {
    const perms = await permissionService.getEffectivePermissions(req.orgId!, req.userId!);
    res.json({ role: req.orgRole, permissions: perms });
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /api/permissions/check/{permission}:
 *   get:
 *     tags: [Permissions]
 *     summary: Vérifier une permission spécifique
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permission
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom de la permission à vérifier
 *     responses:
 *       200:
 *         description: Résultat de la vérification
 */
// GET /api/permissions/check/:permission
router.get('/check/:permission', requireAuth, resolveTenant, requireOrg, async (req: AuthRequest, res: Response) => {
  try {
    const permission = Array.isArray(req.params.permission) ? req.params.permission[0] : req.params.permission;
    const has = await permissionService.hasPermission(req.orgId!, req.userId!, permission as Permission);
    res.json({ permission, granted: has });
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /api/permissions/members/{userId}:
 *   get:
 *     tags: [Permissions]
 *     summary: Obtenir les permissions d'un membre
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Permissions du membre
 *       404:
 *         description: Membre introuvable
 */
// GET /api/permissions/members/:userId
router.get('/members/:userId', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ params: userIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const perms = await permissionService.getMemberPermissions(req.orgId!, userId);
    res.json(perms);
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /api/permissions/members/{userId}/effective:
 *   get:
 *     tags: [Permissions]
 *     summary: Obtenir les permissions effectives d'un membre
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Permissions effectives du membre
 *       404:
 *         description: Membre introuvable
 */
// GET /api/permissions/members/:userId/effective
router.get('/members/:userId/effective', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ params: userIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const perms = await permissionService.getEffectivePermissions(req.orgId!, userId);
    res.json(perms);
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /api/permissions/members/{userId}/grant:
 *   post:
 *     tags: [Permissions]
 *     summary: Accorder une permission à un membre
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permission:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission accordée
 *       404:
 *         description: Membre introuvable
 */
// POST /api/permissions/members/:userId/grant
router.post('/members/:userId/grant', requireAuth, resolveTenant, requireOrg, requireOwner, validate({ params: userIdParam, body: grantPermissionBody }), async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.userId);
    await permissionService.grantPermission(req.orgId!, userId, req.body.permission);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'PERMISSION_GRANTED', entityType: 'OrganizationMember', entityId: userId, organizationId: req.orgId!, ipAddress: getClientIp(req), changes: { permission: req.body.permission } });
    res.json({ message: 'Permission accordée' });
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /api/permissions/members/{userId}/revoke:
 *   post:
 *     tags: [Permissions]
 *     summary: Révoquer une permission d'un membre
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permission:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission révoquée
 *       404:
 *         description: Membre introuvable
 */
// POST /api/permissions/members/:userId/revoke
router.post('/members/:userId/revoke', requireAuth, resolveTenant, requireOrg, requireOwner, validate({ params: userIdParam, body: revokePermissionBody }), async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.userId);
    await permissionService.revokePermission(req.orgId!, userId, req.body.permission);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'PERMISSION_REVOKED', entityType: 'OrganizationMember', entityId: userId, organizationId: req.orgId!, ipAddress: getClientIp(req), changes: { permission: req.body.permission } });
    res.json({ message: 'Permission révoquée' });
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /api/permissions/members/{userId}/reset:
 *   post:
 *     tags: [Permissions]
 *     summary: Réinitialiser les permissions d'un membre
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Permissions réinitialisées
 *       404:
 *         description: Membre introuvable
 */
// POST /api/permissions/members/:userId/reset
router.post('/members/:userId/reset', requireAuth, resolveTenant, requireOrg, requireOwner, validate({ params: userIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.userId);
    await permissionService.resetToDefaults(req.orgId!, userId);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'PERMISSIONS_RESET', entityType: 'OrganizationMember', entityId: userId, organizationId: req.orgId!, ipAddress: getClientIp(req), changes: {} });
    res.json({ message: 'Permissions réinitialisées' });
  } catch (err) { handleError(res, err); }
});

export default router;
