import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./keycloak-auth";
import { createLogger } from "../utils/logger";

const logger = createLogger("AsyncHandler");

/**
 * Wrapper pour les handlers de routes async — élimine le try/catch dupliqué (D4).
 * Attrape les erreurs et retourne une réponse 500 standardisée avec logging.
 *
 * Usage :
 *   router.get("/endpoint", requireAuth, asyncHandler(async (req, res) => {
 *     // ... logique métier, pas besoin de try/catch
 *   }));
 */
export function asyncHandler(
  fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      logger.error(`[${req.method} ${req.path}]`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Erreur serveur" });
      }
    });
  };
}
