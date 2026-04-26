import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { resolveTenant, requireOrg } from "../middleware/tenant.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/asyncHandler";
import { createEntite, updateEntite, listEntitesQuery } from "../schemas/entites.schema";
import * as service from "../services/entites.service";
import { AuditService } from "../services/audit.service";
import { getClientIp } from "../utils/ip";

const router = Router();

// Toutes les routes requierent un tenant resolu (l'organisation courante)
router.use(requireAuth, resolveTenant, requireOrg);

router.get("/", validate({ query: listEntitesQuery }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const result = await service.listEntites(orgId, {
    secteurActivite: req.query.secteurActivite as never,
    actif: req.query.actif as boolean | undefined,
    search: req.query.search as string | undefined,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
  });
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

router.post("/", validate({ body: createEntite }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const created = await service.createEntite(orgId, req.body);
  AuditService.log({
    actorId: req.userId!, actorEmail: req.userEmail!,
    action: 'ENTITE_CREATED', entityType: 'Entite', entityId: created.id,
    organizationId: orgId, ipAddress: getClientIp(req),
    changes: { raisonSociale: created.raisonSociale, secteurActivite: created.secteurActivite, isClientSelf: created.isClientSelf },
  });
  res.status(201).json(created);
}));

router.patch("/:id", validate({ body: updateEntite }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const updated = await service.updateEntite(orgId, String(req.params.id), req.body);
  AuditService.log({
    actorId: req.userId!, actorEmail: req.userEmail!,
    action: 'ENTITE_UPDATED', entityType: 'Entite', entityId: updated.id,
    organizationId: orgId, ipAddress: getClientIp(req),
    changes: { fields: Object.keys(req.body) },
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
