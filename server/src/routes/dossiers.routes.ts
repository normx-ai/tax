import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { resolveTenant, requireOrg } from "../middleware/tenant.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/asyncHandler";
import { updateDossierBody, listDossiersQuery, recalculerDossiersBody } from "../schemas/dossiers.schema";
import * as service from "../services/dossiers.service";

const router = Router();

router.use(requireAuth, resolveTenant, requireOrg);

router.get("/", validate({ query: listDossiersQuery }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const result = await service.listDossiersByOrg(orgId, {
    entiteId: req.query.entiteId as string | undefined,
    statut: req.query.statut as never,
    obligationCode: req.query.obligationCode as string | undefined,
    dateMin: req.query.dateMin as Date | undefined,
    dateMax: req.query.dateMax as Date | undefined,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
  });
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
  res.json(updated);
}));

router.post("/recalculer", validate({ body: recalculerDossiersBody }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const orgId = req.orgId!;
  const { entiteId, anneeFiscale } = req.body as { entiteId?: string; anneeFiscale?: number };
  if (entiteId) {
    const r = await service.recalculerDossiers(entiteId, anneeFiscale);
    res.json(r);
    return;
  }
  const results = await service.recalculerDossiersOrg(orgId, anneeFiscale);
  res.json({ entitesTraitees: results.length, results });
}));

export default router;
