import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { resolveTenant } from "../middleware/tenant.middleware";
import { asyncHandler } from "../middleware/asyncHandler";
import pool from "../db/pool";

const router = Router();

// GET /api/favorites — Liste des favoris de l'utilisateur
router.get("/", requireAuth, resolveTenant, asyncHandler(async (req: AuthRequest, res: Response) => {
  const s = req.tenantSchema!;
  const result = await pool.query(
    `SELECT article_id, created_at FROM "${s}".favorites WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.userId!]
  );
  res.json({ favorites: result.rows.map((r) => r.article_id) });
}));

// POST /api/favorites/:articleId — Ajouter un favori
router.post("/:articleId", requireAuth, resolveTenant, asyncHandler(async (req: AuthRequest, res: Response) => {
  const s = req.tenantSchema!;
  const { articleId } = req.params;
  await pool.query(
    `INSERT INTO "${s}".favorites (user_id, article_id) VALUES ($1, $2) ON CONFLICT (user_id, article_id) DO NOTHING`,
    [req.userId!, articleId]
  );
  res.json({ added: articleId });
}));

// DELETE /api/favorites/:articleId — Retirer un favori
router.delete("/:articleId", requireAuth, resolveTenant, asyncHandler(async (req: AuthRequest, res: Response) => {
  const s = req.tenantSchema!;
  const { articleId } = req.params;
  await pool.query(
    `DELETE FROM "${s}".favorites WHERE user_id = $1 AND article_id = $2`,
    [req.userId!, articleId]
  );
  res.json({ removed: articleId });
}));

export default router;
