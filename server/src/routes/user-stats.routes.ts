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

  res.json({
    totalQuestions: stats.messages,
    totalSearches: stats.searches,
    totalConversations: stats.conversations,
    last7Days: usage,
  });
}));

export default router;
