import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { resolveTenant } from "../middleware/tenant.middleware";
import { asyncHandler } from "../middleware/asyncHandler";
import * as analyticsDb from "../db/analytics.db";

const router = Router();

// GET /api/user/stats
router.get("/", requireAuth, resolveTenant, asyncHandler(async (req: AuthRequest, res: Response) => {
  const s = req.tenantSchema!;
  const stats = await analyticsDb.getUserStats(s, req.userId!);
  const usage = await analyticsDb.getUsageByPeriod(s, req.userId!, 7);

  // Transformer le format usage en tableau fixe de 7 jours
  // (un objet par jour avec { date, questions })
  const last7Days: { date: string; questions: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayRows = usage.filter((r: { date: string }) =>
      String(r.date).startsWith(dateStr)
    );
    const questions = dayRows.reduce(
      (sum: number, r: { count: string }) => sum + parseInt(r.count || "0"),
      0
    );
    last7Days.push({ date: dateStr, questions });
  }

  res.json({
    totalQuestions: stats.messages,
    monthQuestions: stats.monthMessages,
    totalArticles: stats.searches,
    activeDays: stats.activeDays,
    last7Days,
  });
}));

export default router;
