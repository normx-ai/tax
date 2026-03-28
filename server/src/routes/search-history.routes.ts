// server/src/routes/search-history.routes.ts
// Routes historique de recherche — consultation, populaires, purge RGPD

import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate.middleware";
import { searchHistoryQuery } from "../schemas/search-history.schema";
import prisma from "../utils/prisma";

const router = Router();

/**
 * @swagger
 * /api/search-history:
 *   get:
 *     tags: [Search History]
 *     summary: Historique de recherche de l'utilisateur
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
 *     responses:
 *       200:
 *         description: Historique de recherche paginé
 */
router.get("/", requireAuth, validate({ query: searchHistoryQuery }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const page = Number(req.query.page);
  const limit = Number(req.query.limit);
  const skip = (page - 1) * limit;

  const [searches, total] = await Promise.all([
    prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      select: {
        id: true,
        query: true,
        createdAt: true,
        article: {
          select: { id: true, numero: true, titre: true },
        },
      },
    }),
    prisma.searchHistory.count({ where: { userId } }),
  ]);

  res.json({ searches, total, page, limit });
}));

/**
 * @swagger
 * /api/search-history/popular:
 *   get:
 *     tags: [Search History]
 *     summary: Recherches les plus populaires
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top 10 des termes les plus recherchés
 */
router.get("/popular", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  // Scopé par utilisateur pour éviter la fuite de données inter-organisations (HIGH-04)
  const popular = await prisma.searchHistory.groupBy({
    by: ["query"],
    where: { userId },
    _count: { query: true },
    orderBy: { _count: { query: "desc" } },
    take: 10,
  });

  res.json({
    popular: popular.map((p) => ({
      query: p.query,
      count: p._count.query,
    })),
  });
}));

/**
 * @swagger
 * /api/search-history:
 *   delete:
 *     tags: [Search History]
 *     summary: Purger l'historique de recherche (RGPD)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historique supprimé
 */
router.delete("/", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { count } = await prisma.searchHistory.deleteMany({
    where: { userId },
  });

  res.json({ message: "Historique supprimé", count });
}));

export default router;
