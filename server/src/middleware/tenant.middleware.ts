import { Response, NextFunction } from "express";
import { AuthRequest } from "./keycloak-auth";
import { createTenantSchema, ensureUserInSchema } from "../db/tenant.service";
import prisma from "../utils/prisma";
import { OrgRole, ROLE_DEFAULTS, PermissionMap } from "../types/permissions";
import { createLogger } from "../utils/logger";

const logger = createLogger("TenantMiddleware");

/**
 * Middleware principal : résout le tenant, l'utilisateur, l'organisation et les permissions.
 *
 * Flux :
 * 1. Vérifie que req.userId existe (set par keycloak-auth)
 * 2. Auto-crée l'utilisateur dans public.users si absent
 * 3. Trouve ou crée l'organisation + membership + subscription
 * 4. Set req.orgId, req.orgRole, req.orgPermissions
 * 5. Crée le tenant schema PostgreSQL
 */
export async function resolveTenant(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  try {
    // 1. Auto-créer l'utilisateur dans public.users si absent
    const existingUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!existingUser) {
      const nameParts = (req.userName || "").split(" ");
      const firstName = nameParts[0] || null;
      const lastName = nameParts.slice(1).join(" ") || null;

      try {
        await prisma.user.create({
          data: {
            id: req.userId,
            email: req.userEmail || `${req.userId}@keycloak.local`,
            password: "KEYCLOAK_SSO",
            firstName,
            lastName,
            isEmailVerified: true,
          },
        });
        logger.info(`Utilisateur auto-créé: ${req.userEmail}`);
      } catch (err: unknown) {
        // Email déjà utilisé par un ancien compte -> mettre à jour l'id
        if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
          await prisma.user.update({
            where: { email: req.userEmail! },
            data: { id: req.userId },
          });
          logger.info(`Utilisateur migré vers Keycloak sub: ${req.userEmail}`);
        } else {
          throw err;
        }
      }
    }

    // 2. Trouver l'organisation de l'utilisateur
    let membership = await prisma.organizationMember.findFirst({
      where: { userId: req.userId },
      select: { organizationId: true, role: true, permissions: true },
    });

    // 3. Si pas de membership, auto-créer org + membership + subscription FREE
    if (!membership) {
      const orgSlug = `personal_${req.userId.replace(/-/g, "_")}`;
      const orgName = req.userName || req.userEmail || "Mon organisation";

      const result = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: { name: orgName, slug: orgSlug },
        });
        const member = await tx.organizationMember.create({
          data: {
            userId: req.userId!,
            organizationId: org.id,
            role: "OWNER",
          },
        });
        await tx.subscription.create({
          data: {
            type: "PERSONAL",
            organizationId: org.id,
            plan: "FREE",
            status: "TRIALING",
            creditsPerMonth: 0,
            creditsTotal: 10,
            currentPeriodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        });
        logger.info(`Organisation auto-créée: ${orgName} pour ${req.userEmail}`);
        return member;
      });

      membership = { organizationId: result.organizationId, role: result.role, permissions: result.permissions };
    }

    // 4. Set req.orgId, req.orgRole, req.orgPermissions
    req.orgId = membership.organizationId;
    req.orgRole = membership.role;

    const roleDefaults = ROLE_DEFAULTS[membership.role as OrgRole] || {};
    const customPerms = (membership.permissions as PermissionMap) || {};
    req.orgPermissions = { ...roleDefaults, ...customPerms };

    // 5. Créer le tenant schema PostgreSQL
    const tenantSlug = req.userId.replace(/-/g, "_");
    const schema = await createTenantSchema(tenantSlug);
    req.tenantSchema = schema;

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
  if (!req.orgId) {
    res.status(400).json({ error: "Organisation requise" });
    return;
  }
  next();
}
