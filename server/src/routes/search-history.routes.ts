import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { resolveTenant } from "../middleware/tenant.middleware";
import { asyncHandler } from "../middleware/asyncHandler";
import { typedRoute } from "../middleware/typed-route";
import { searchHistoryQuery } from "../schemas/search-history.schema";
import pool from "../db/pool";

const router = Router();

// GET /api/search-history
router.get("/", requireAuth, resolveTenant, ...typedRoute({ query: searchHistoryQuery }, async (req, res) => {
  const s = req.tenantSchema!;
  const userId = req.userId!;
  const { page, limit } = req.validated.query;
  const offset = (page - 1) * limit;

  const [searches, countResult] = await Promise.all([
    pool.query(
      `SELECT id, query, results_count AS "resultsCount", created_at AS "createdAt" FROM "${s}".search_history
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) as c FROM "${s}".search_history WHERE user_id = $1`,
      [userId]
    ),
  ]);

  res.json({ searches: searches.rows, total: parseInt(countResult.rows[0].c), page, limit });
}));

// GET /api/search-history/popular
router.get("/popular", requireAuth, resolveTenant, asyncHandler(async (req: AuthRequest, res: Response) => {
  const s = req.tenantSchema!;
  const result = await pool.query(
    `SELECT query, COUNT(*) as count FROM "${s}".search_history
     WHERE user_id = $1 GROUP BY query ORDER BY count DESC LIMIT 10`,
    [req.userId!]
  );
  res.json({ popular: result.rows });
}));

// DELETE /api/search-history (RGPD)
router.delete("/", requireAuth, resolveTenant, asyncHandler(async (req: AuthRequest, res: Response) => {
  const s = req.tenantSchema!;
  const result = await pool.query(
    `DELETE FROM "${s}".search_history WHERE user_id = $1`,
    [req.userId!]
  );
  res.json({ message: "Historique supprimé", count: result.rowCount });
}));

export default router;
