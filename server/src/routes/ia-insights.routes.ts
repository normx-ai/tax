import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { resolveTenant, requireOrg } from "../middleware/tenant.middleware";
import { asyncHandler } from "../middleware/asyncHandler";
import { getInsightsForOrg, invalidateCache } from "../services/ia-insights.service";

const router = Router();

router.use(requireAuth, resolveTenant, requireOrg);

router.get("/", asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const force = req.query.force === "true";
  const result = await getInsightsForOrg(orgId, force);
  res.json(result);
}));

router.post("/refresh", asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  invalidateCache(orgId);
  const result = await getInsightsForOrg(orgId, true);
  res.json(result);
}));

export default router;
