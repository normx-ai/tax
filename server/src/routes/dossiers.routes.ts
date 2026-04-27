import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { resolveTenant, requireOrg } from "../middleware/tenant.middleware";
import { validate } from "../middleware/validate.middleware";
import { typedRoute } from "../middleware/typed-route";
import { asyncHandler } from "../middleware/asyncHandler";
import { updateDossierBody, listDossiersQuery, recalculerDossiersBody } from "../schemas/dossiers.schema";
import * as service from "../services/dossiers.service";
import { AuditService } from "../services/audit.service";
import { getClientIp } from "../utils/ip";

const router = Router();

router.use(requireAuth, resolveTenant, requireOrg);

router.get("/", ...typedRoute({ query: listDossiersQuery }, async (req, res) => {
  const result = await service.listDossiersByOrg(req.orgId!, req.validated.query);
  res.json(result);
}));

router.get("/kpis", asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const annee = req.query.anneeFiscale ? parseInt(String(req.query.anneeFiscale), 10) : undefined;
  const kpis = await service.getDashboardKpis(orgId, annee);
  res.json(kpis);
}));

router.get("/:id", asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const d = await service.getDossierById(orgId, String(req.params.id));
  if (!d) {
    res.status(404).json({ error: "Dossier non trouvé" });
    return;
  }
  res.json(d);
}));

router.patch("/:id", validate({ body: updateDossierBody }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const body = req.body;
  const updated = await service.updateDossier(orgId, String(req.params.id), {
    ...body,
    dateDepot: body.dateDepot ? new Date(body.dateDepot) : body.dateDepot,
    datePaiement: body.datePaiement ? new Date(body.datePaiement) : body.datePaiement,
  });
  AuditService.log({
    actorId: req.userId!, actorEmail: req.userEmail!,
    action: 'DOSSIER_UPDATED', entityType: 'Dossier', entityId: updated.id,
    organizationId: orgId, ipAddress: getClientIp(req),
    changes: { fields: Object.keys(req.body), statut: updated.statut },
  });
  res.json(updated);
}));

router.post("/recalculer", validate({ body: recalculerDossiersBody }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const { entiteId, anneeFiscale } = req.body as { entiteId?: string; anneeFiscale?: number };
  if (entiteId) {
    const r = await service.recalculerDossiers(entiteId, anneeFiscale);
    AuditService.log({
      actorId: req.userId!, actorEmail: req.userEmail!,
      action: 'DOSSIERS_RECALCULES', entityType: 'Entite', entityId: entiteId,
      organizationId: orgId, ipAddress: getClientIp(req),
      changes: { anneeFiscale: r.anneeFiscale, applicables: r.obligationsApplicables, traites: r.dossiersTraites },
    });
    res.json(r);
    return;
  }
  const results = await service.recalculerDossiersOrg(orgId, anneeFiscale);
  AuditService.log({
    actorId: req.userId!, actorEmail: req.userEmail!,
    action: 'DOSSIERS_RECALCULES', entityType: 'Organization', entityId: orgId,
    organizationId: orgId, ipAddress: getClientIp(req),
    changes: { anneeFiscale, entitesTraitees: results.length },
  });
  res.json({ entitesTraitees: results.length, results });
}));

export default router;
