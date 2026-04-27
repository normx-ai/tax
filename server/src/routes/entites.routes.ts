import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { resolveTenant, requireOrg } from "../middleware/tenant.middleware";
import { typedRoute } from "../middleware/typed-route";
import { asyncHandler } from "../middleware/asyncHandler";
import { createEntite, updateEntite, listEntitesQuery } from "../schemas/entites.schema";
import * as service from "../services/entites.service";
import { AuditService } from "../services/audit.service";
import { getClientIp } from "../utils/ip";

const router = Router();

// Toutes les routes requierent un tenant resolu (l'organisation courante)
router.use(requireAuth, resolveTenant, requireOrg);

router.get("/", ...typedRoute({ query: listEntitesQuery }, async (req, res) => {
  const result = await service.listEntites(req.orgId!, req.validated.query);
  res.json(result);
}));

router.get("/self", asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const self = await service.getClientSelf(orgId);
  if (!self) {
    res.status(404).json({ error: "Aucune entité 'self' configurée" });
    return;
  }
  res.json(self);
}));

router.get("/:id", asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const e = await service.getEntiteById(orgId, String(req.params.id));
  if (!e) {
    res.status(404).json({ error: "Entité non trouvée" });
    return;
  }
  res.json(e);
}));

router.post("/", ...typedRoute({ body: createEntite }, async (req, res) => {
  const orgId = req.orgId!;
  const created = await service.createEntite(orgId, req.validated.body);
  AuditService.log({
    actorId: req.userId!, actorEmail: req.userEmail!,
    action: 'ENTITE_CREATED', entityType: 'Entite', entityId: created.id,
    organizationId: orgId, ipAddress: getClientIp(req),
    changes: { raisonSociale: created.raisonSociale, secteurActivite: created.secteurActivite, isClientSelf: created.isClientSelf },
  });
  res.status(201).json(created);
}));

router.patch("/:id", ...typedRoute({ body: updateEntite }, async (req, res) => {
  const orgId = req.orgId!;
  const updated = await service.updateEntite(orgId, String(req.params.id), req.validated.body);
  AuditService.log({
    actorId: req.userId!, actorEmail: req.userEmail!,
    action: 'ENTITE_UPDATED', entityType: 'Entite', entityId: updated.id,
    organizationId: orgId, ipAddress: getClientIp(req),
    changes: { fields: Object.keys(req.validated.body) },
  });
  res.json(updated);
}));

router.post("/:id/desactiver", asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const updated = await service.deactivateEntite(orgId, String(req.params.id));
  AuditService.log({
    actorId: req.userId!, actorEmail: req.userEmail!,
    action: 'ENTITE_DEACTIVATED', entityType: 'Entite', entityId: updated.id,
    organizationId: orgId, ipAddress: getClientIp(req),
    changes: { raisonSociale: updated.raisonSociale },
  });
  res.json(updated);
}));

router.post("/:id/activer", asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const updated = await service.activateEntite(orgId, String(req.params.id));
  AuditService.log({
    actorId: req.userId!, actorEmail: req.userEmail!,
    action: 'ENTITE_ACTIVATED', entityType: 'Entite', entityId: updated.id,
    organizationId: orgId, ipAddress: getClientIp(req),
    changes: { raisonSociale: updated.raisonSociale },
  });
  res.json(updated);
}));

export default router;
