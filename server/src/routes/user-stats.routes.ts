// server/src/routes/user-stats.routes.ts
// Route statistiques personnelles utilisateur

import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { asyncHandler } from "../middleware/asyncHandler";
import prisma from "../utils/prisma";

const router = Router();

/**
 * @swagger
 * /api/user/stats:
 *   get:
 *     tags: [User]
 *     summary: Statistiques personnelles de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques personnelles
 */
router.get("/", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const now = new Date();

  // Début du mois en cours
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // 7 derniers jours
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  // Stats globales (toutes les entrées UsageStats pour cet utilisateur)
  const allStats = await prisma.usageStats.findMany({
    where: { userId },
    select: {
      date: true,
      questionsAsked: true,
      articlesViewed: true,
    },
  });

  // Totaux
  let totalQuestions = 0;
  let totalArticles = 0;
  let monthQuestions = 0;
  const activeDays = new Set<string>();
  const last7Days: { date: string; questions: number }[] = [];

  // Préparer les 7 derniers jours
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().split("T")[0];
    last7Days.push({ date: key, questions: 0 });
  }

  for (const stat of allStats) {
    totalQuestions += stat.questionsAsked;
    totalArticles += stat.articlesViewed;

    const dateKey = stat.date.toISOString().split("T")[0];

    if (stat.questionsAsked > 0 || stat.articlesViewed > 0) {
      activeDays.add(dateKey);
    }

    // Ce mois-ci
    if (stat.date >= monthStart) {
      monthQuestions += stat.questionsAsked;
    }

    // Derniers 7 jours
    if (stat.date >= weekAgo) {
      const dayEntry = last7Days.find((d) => d.date === dateKey);
      if (dayEntry) {
        dayEntry.questions += stat.questionsAsked;
      }
    }
  }

  res.json({
    totalQuestions,
    monthQuestions,
    totalArticles,
    activeDays: activeDays.size,
    last7Days,
  });
}));

export default router;
