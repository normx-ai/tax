import { Router } from 'express';
import { requireAuth } from '../middleware/keycloak-auth';
import { resolveTenant, requireOrg } from '../middleware/tenant.middleware';
import { requireOwner, requireAdmin } from '../middleware/orgRole.middleware';
import { typedRoute } from '../middleware/typed-route';
import { orgAuditQuery, userAuditQuery, userAuditParams, entityAuditParams, searchAuditQuery, statsAuditQuery, cleanupAuditBody } from '../schemas/audit.schema';
import { AuditService } from '../services/audit.service';
import { getClientIp } from '../utils/ip';

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
router.get('/organization', requireAuth, resolveTenant, requireOrg, requireAdmin, ...typedRoute({ query: orgAuditQuery }, async (req, res) => {
  const { page, limit, action } = req.validated.query;
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
router.get('/user/:userId', requireAuth, resolveTenant, requireOrg, requireAdmin, ...typedRoute({ params: userAuditParams, query: userAuditQuery }, async (req, res) => {
  const { page, limit } = req.validated.query;
  const result = await AuditService.getUserActions(req.validated.params.userId, { page, limit });
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
router.get('/entity/:type/:id', requireAuth, resolveTenant, requireOrg, requireAdmin, ...typedRoute({ params: entityAuditParams }, async (req, res) => {
  const { type, id } = req.validated.params;
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
router.get('/search', requireAuth, resolveTenant, requireOrg, requireAdmin, ...typedRoute({ query: searchAuditQuery }, async (req, res) => {
  const result = await AuditService.search(req.orgId!, req.validated.query);
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
router.get('/stats', requireAuth, resolveTenant, requireOrg, requireAdmin, ...typedRoute({ query: statsAuditQuery }, async (req, res) => {
  const { days } = req.validated.query;
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
router.post('/cleanup', requireAuth, resolveTenant, requireOrg, requireOwner, ...typedRoute({ body: cleanupAuditBody }, async (req, res) => {
  const { olderThanDays } = req.validated.body;
  const result = await AuditService.gdprCleanup(req.orgId!, olderThanDays);
  AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'DATA_EXPORTED', entityType: 'AuditLog', entityId: req.orgId!, organizationId: req.orgId!, ipAddress: getClientIp(req), changes: { type: 'gdpr_cleanup', deleted: result.deleted } });
  res.json(result);
}));

export default router;
