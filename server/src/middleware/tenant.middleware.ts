import { Response, NextFunction } from "express";
import { AuthRequest } from "./keycloak-auth";
import { createTenantSchema, ensureUserInSchema } from "../db/tenant.service";
import { createLogger } from "../utils/logger";

const logger = createLogger("TenantMiddleware");

export async function resolveTenant(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  try {
    // Chaque utilisateur Keycloak obtient son propre schema
    const tenantSlug = req.userId.replace(/-/g, "_");
    const schema = await createTenantSchema(tenantSlug);

    req.tenantSchema = schema;
    req.orgId = req.userId; // compat

    // Auto-creer l'utilisateur dans le schema
    await ensureUserInSchema(
      schema,
      req.userId,
      req.userEmail || "",
      req.userName || "",
      ""
    );

    next();
  } catch (err) {
    logger.error("Erreur résolution tenant", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

export function requireOrg(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.tenantSchema) {
    res.status(400).json({ error: "Tenant requis" });
    return;
  }
  next();
}
