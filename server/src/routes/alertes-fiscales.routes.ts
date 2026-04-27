import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/keycloak-auth';
import { resolveTenant, requireOrg } from '../middleware/tenant.middleware';
import { requireAdmin } from '../middleware/orgRole.middleware';
import { listAlertesQuery } from '../schemas/alertes-fiscales.schema';
import { typedRoute } from '../middleware/typed-route';
import * as alertesService from '../services/alertes-fiscales.service';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

/**
 * @swagger
 * /api/alertes-fiscales:
 *   get:
 *     tags: [Alertes]
 *     summary: Liste des alertes fiscales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: categorie
 *         schema:
 *           type: string
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
 *         description: Alertes fiscales paginées
 */
router.get('/', requireAuth, ...typedRoute({ query: listAlertesQuery }, async (req, res) => {
  const result = await alertesService.getAllAlertes(req.validated.query);
  res.json(result);
}));

/**
 * @swagger
 * /api/alertes-fiscales/stats:
 *   get:
 *     tags: [Alertes]
 *     summary: Statistiques des alertes fiscales
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des alertes
 */
router.get('/stats', requireAuth, asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await alertesService.getStats();
  res.json(stats);
}));

/**
 * @swagger
 * /api/alertes-fiscales/article/{n}:
 *   get:
 *     tags: [Alertes]
 *     summary: Alertes fiscales par article
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: n
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alertes liées à l'article
 */
router.get('/article/:n', requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const n = Array.isArray(req.params.n) ? req.params.n[0] : req.params.n;

  // Validation : :n doit être un entier positif (LOW-10)
  const parsed = parseInt(n, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== n) {
    res.status(400).json({ error: 'Le paramètre "n" doit être un entier positif' });
    return;
  }

  const alertes = await alertesService.getByArticle(n);
  res.json(alertes);
}));

/**
 * @swagger
 * /api/alertes-fiscales/extract:
 *   post:
 *     tags: [Alertes]
 *     summary: Extraction et alimentation des alertes fiscales
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Résultat de l'extraction
 */
router.post('/extract', requireAuth, resolveTenant, requireOrg, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.body.seed) {
    const result = await alertesService.seedPredefinedAlertes();
    res.json(result);
    return;
  }
  if (req.body.text) {
    const extractions = await alertesService.extractFromText(req.body.text);
    res.json({ extractions });
    return;
  }
  res.status(400).json({ error: 'Paramètre "seed" ou "text" requis' });
}));

export default router;
