import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/keycloak-auth';
import { resolveTenant, requireOrg } from '../middleware/tenant.middleware';
import { requireOwner, requireAdmin } from '../middleware/orgRole.middleware';
import { validate } from '../middleware/validate.middleware';
import { orgAuditQuery, userAuditQuery, userAuditParams, entityAuditParams, searchAuditQuery, statsAuditQuery, cleanupAuditBody } from '../schemas/audit.schema';
import type { z } from 'zod';

type OrgAuditQuery = z.infer<typeof orgAuditQuery>;
type UserAuditQuery = z.infer<typeof userAuditQuery>;
type SearchAuditQuery = z.infer<typeof searchAuditQuery>;
type StatsAuditQuery = z.infer<typeof statsAuditQuery>;
import { AuditService } from '../services/audit.service';
import { getClientIp } from '../utils/ip';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

/**
 * @swagger
 * /api/audit/organization:
 *   get:
 *     tags: [Audit]
 *     summary: Journal d'audit de l'organisation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logs d'audit paginés
 */
router.get('/organization', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ query: orgAuditQuery }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, action } = req.validated!.query as OrgAuditQuery;
  const result = await AuditService.getOrganizationAudit(req.orgId!, { page, limit, action });
  res.json(result);
}));

/**
 * @swagger
 * /api/audit/user/{userId}:
 *   get:
 *     tags: [Audit]
 *     summary: Actions d'un utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Actions de l'utilisateur
 */
router.get('/user/:userId', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ params: userAuditParams, query: userAuditQuery }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = String(req.params.userId);
  const { page, limit } = req.validated!.query as UserAuditQuery;
  const result = await AuditService.getUserActions(userId, { page, limit });
  res.json(result);
}));

/**
 * @swagger
 * /api/audit/entity/{type}/{id}:
 *   get:
 *     tags: [Audit]
 *     summary: Historique d'une entité
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Historique de l'entité
 */
router.get('/entity/:type/:id', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ params: entityAuditParams }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const type = String(req.params.type);
  const id = String(req.params.id);
  const logs = await AuditService.getEntityHistory(type, id);
  res.json(logs);
}));

/**
 * @swagger
 * /api/audit/search:
 *   get:
 *     tags: [Audit]
 *     summary: Recherche dans les logs d'audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: actorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Résultats de recherche paginés
 */
router.get('/search', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ query: searchAuditQuery }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.validated!.query as SearchAuditQuery;
  const result = await AuditService.search(req.orgId!, query);
  res.json(result);
}));

/**
 * @swagger
 * /api/audit/stats:
 *   get:
 *     tags: [Audit]
 *     summary: Statistiques d'audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Statistiques d'audit
 */
router.get('/stats', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ query: statsAuditQuery }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { days } = req.validated!.query as StatsAuditQuery;
  const stats = await AuditService.getStats(req.orgId!, days);
  res.json(stats);
}));

/**
 * @swagger
 * /api/audit/cleanup:
 *   post:
 *     tags: [Audit]
 *     summary: Nettoyage RGPD des logs d'audit
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               olderThanDays:
 *                 type: number
 *     responses:
 *       200:
 *         description: Résultat du nettoyage
 */
router.post('/cleanup', requireAuth, resolveTenant, requireOrg, requireOwner, validate({ body: cleanupAuditBody }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { olderThanDays } = req.body;
  const result = await AuditService.gdprCleanup(req.orgId!, olderThanDays);
  AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'DATA_EXPORTED', entityType: 'AuditLog', entityId: req.orgId!, organizationId: req.orgId!, ipAddress: getClientIp(req), changes: { type: 'gdpr_cleanup', deleted: result.deleted } });
  res.json(result);
}));

export default router;
