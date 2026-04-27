import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/keycloak-auth';
import { resolveTenant, requireOrg } from '../middleware/tenant.middleware';
import { requireAdmin, requireMember } from '../middleware/orgRole.middleware';
import { requirePaid } from '../middleware/subscription.middleware';
import { typedRoute } from '../middleware/typed-route';
import { daysQuery, popularSearchesQuery, responseTimesQuery } from '../schemas/analytics.schema';
import * as analyticsService from '../services/analytics.service';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     tags: [Analytics]
 *     summary: Obtenir les données du tableau de bord
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données du tableau de bord
 */
// GET /api/analytics/dashboard
router.get('/dashboard', requireAuth, resolveTenant, requireOrg, requireMember, requirePaid, asyncHandler(async (req: AuthRequest, res: Response) => {
  const dashboard = await analyticsService.getDashboard(req.orgId!);
  res.json(dashboard);
}));

/**
 * @swagger
 * /api/analytics/timeseries:
 *   get:
 *     tags: [Analytics]
 *     summary: Obtenir les données de série temporelle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 30
 *         description: Nombre de jours à inclure
 *     responses:
 *       200:
 *         description: Données de série temporelle
 */
// GET /api/analytics/timeseries
router.get('/timeseries', requireAuth, resolveTenant, requireOrg, requireAdmin, ...typedRoute({ query: daysQuery }, async (req, res) => {
  const data = await analyticsService.getTimeSeries(req.orgId!, req.validated.query.days);
  res.json(data);
}));

/**
 * @swagger
 * /api/analytics/members:
 *   get:
 *     tags: [Analytics]
 *     summary: Obtenir les statistiques des membres
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des membres
 */
// GET /api/analytics/members
router.get('/members', requireAuth, resolveTenant, requireOrg, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await analyticsService.getMemberStats(req.orgId!);
  res.json(stats);
}));

/**
 * @swagger
 * /api/analytics/export:
 *   get:
 *     tags: [Analytics]
 *     summary: Exporter les données en CSV
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 30
 *         description: Nombre de jours à inclure
 *     responses:
 *       200:
 *         description: Fichier CSV exporté
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
// GET /api/analytics/export
router.get('/export', requireAuth, resolveTenant, requireOrg, requireAdmin, ...typedRoute({ query: daysQuery }, async (req, res) => {
  const csv = await analyticsService.exportCsv(req.orgId!, req.validated.query.days);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=analytics-${req.orgId}.csv`);
  res.send(csv);
}));

// GET /api/analytics/popular-searches
// limit: 1-100 (default 10), offset: 0+ (default 0) — validation Zod
router.get('/popular-searches', requireAuth, resolveTenant, requireOrg, requireMember, ...typedRoute({ query: popularSearchesQuery }, async (req, res) => {
  const { limit, offset } = req.validated.query;
  const data = await analyticsService.getPopularSearches(req.orgId!, limit, offset);
  res.json(data);
}));

// GET /api/analytics/response-times
// days: 1-365 (default 30) — validation Zod pour eviter un scan massif
router.get('/response-times', requireAuth, resolveTenant, requireOrg, requireMember, ...typedRoute({ query: responseTimesQuery }, async (req, res) => {
  const data = await analyticsService.getResponseTimeStats(req.orgId!, req.validated.query.days);
  res.json(data);
}));

// GET /api/analytics/feature-usage
router.get('/feature-usage', requireAuth, resolveTenant, requireOrg, requireMember, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await analyticsService.getFeatureUsage(req.orgId!);
  res.json(data);
}));

export default router;
