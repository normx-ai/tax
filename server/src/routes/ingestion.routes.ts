// server/src/routes/ingestion.routes.ts
// API REST protégée pour l'ingestion d'articles CGI dans PostgreSQL + Qdrant

import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/keycloak-auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { typedRoute } from '../middleware/typed-route';
import { ingestArticlesBody, ingestSourcesBody } from '../schemas/ingestion.schema';
import { ingestArticles, ingestFromSource, type IngestionResult, type SourceFile } from '../services/rag/ingestion.service';
import { createLogger } from '../utils/logger';
import prisma from '../utils/prisma';

const logger = createLogger('IngestionRoutes');
const router = Router();

/**
 * @swagger
 * /api/ingestion/articles:
 *   post:
 *     tags: [Ingestion]
 *     summary: Ingestion directe d'articles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               articles:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Résultat de l'ingestion
 */
router.post('/articles', requireAuth, requireAdmin, ...typedRoute({ body: ingestArticlesBody }, async (req, res) => {
  try {
    const { articles } = req.validated.body;

    logger.info(`Ingestion demandée par ${req.userEmail} : ${articles.length} articles`);

    const result: IngestionResult = await ingestArticles(articles);

    logger.info(`Ingestion terminée : ${result.inserted} insérés, ${result.updated} mis à jour, ${result.errors} erreurs`);

    res.json({
      message: `Ingestion terminée : ${result.inserted} insérés, ${result.updated} mis à jour`,
      result,
    });
  } catch (err) {
    logger.error('Erreur ingestion articles:', err);
    res.status(500).json({ error: 'Erreur lors de l\'ingestion' });
  }
}));

/**
 * @swagger
 * /api/ingestion/sources:
 *   post:
 *     tags: [Ingestion]
 *     summary: Ingestion depuis des fichiers source
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sources:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Résultat de l'ingestion
 */
router.post('/sources', requireAuth, requireAdmin, ...typedRoute({ body: ingestSourcesBody }, async (req, res) => {
  try {
    const { sources } = req.validated.body;

    const totalArticles = sources.reduce((sum: number, s) => sum + (s.articles?.length || 0), 0);
    logger.info(`Ingestion sources demandée par ${req.userEmail} : ${sources.length} fichiers, ${totalArticles} articles`);

    const result: IngestionResult = await ingestFromSource(sources as unknown as SourceFile[]);

    logger.info(`Ingestion sources terminée : ${result.inserted} insérés, ${result.updated} mis à jour, ${result.errors} erreurs`);

    res.json({
      message: `Ingestion terminée : ${result.inserted} insérés, ${result.updated} mis à jour`,
      result,
    });
  } catch (err) {
    logger.error('Erreur ingestion sources:', err);
    res.status(500).json({ error: 'Erreur lors de l\'ingestion' });
  }
}));

/**
 * @swagger
 * /api/ingestion/stats:
 *   get:
 *     tags: [Ingestion]
 *     summary: Statistiques d'ingestion
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des articles ingérés
 */
router.get('/stats', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const [totalArticles, byVersion, byTome, referencesCount] = await Promise.all([
      prisma.article.count(),
      prisma.article.groupBy({ by: ['version'], _count: { id: true } }),
      prisma.article.groupBy({ by: ['tome'], _count: { id: true } }),
      prisma.articleReference.count(),
    ]);

    res.json({
      totalArticles,
      byVersion: byVersion.reduce((acc, v) => ({ ...acc, [v.version]: v._count.id }), {} as Record<string, number>),
      byTome: byTome.reduce((acc, t) => ({ ...acc, [t.tome || 'inconnu']: t._count.id }), {} as Record<string, number>),
      totalReferences: referencesCount,
    });
  } catch (err) {
    logger.error('Erreur stats ingestion:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
