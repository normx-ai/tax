import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/keycloak-auth';
import { requireAdmin } from '../middleware/orgRole.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  createObligation,
  updateObligation,
  listObligationsQuery,
  cloneVersionBody,
  type ListObligationsQuery,
} from '../schemas/obligations.schema';
import * as service from '../services/obligations.service';
import { AuditService } from '../services/audit.service';
import { getClientIp } from '../utils/ip';

const router = Router();

/**
 * @swagger
 * /api/obligations:
 *   get:
 *     tags: [Obligations]
 *     summary: Liste paginee des obligations fiscales du catalogue
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requireAuth, validate({ query: listObligationsQuery }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.validated!.query as ListObligationsQuery;
  const result = await service.listObligations(query);
  res.json(result);
}));

/**
 * @swagger
 * /api/obligations/alertes-aide:
 *   get:
 *     tags: [Obligations]
 *     summary: Alertes fiscales deja extraites du CGI, groupees par categorie.
 *       Aide l'admin a remplir les obligations a partir des donnees connues.
 */
router.get('/alertes-aide', requireAuth, requireAdmin, asyncHandler(async (_req: AuthRequest, res: Response) => {
  const groups = await service.getAlertesByCategorie();
  res.json(groups);
}));

/**
 * @swagger
 * /api/obligations/articles-recherche:
 *   get:
 *     tags: [Obligations]
 *     summary: Autocomplete d'articles CGI pour lier a une obligation
 */
router.get('/articles-recherche', requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const qRaw = req.query.q;
  const versionRaw = req.query.version;
  const q = typeof qRaw === 'string' ? qRaw : '';
  const version = typeof versionRaw === 'string' ? versionRaw : '2026';
  const articles = await service.searchArticles(q, version);
  res.json(articles);
}));

/**
 * @swagger
 * /api/obligations/simulateurs:
 *   get:
 *     tags: [Obligations]
 *     summary: Codes des simulateurs disponibles pour rattacher a une obligation
 */
router.get('/simulateurs', requireAuth, requireAdmin, asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(service.SIMULATEUR_CODES);
}));

/**
 * @swagger
 * /api/obligations/versions:
 *   get:
 *     tags: [Obligations]
 *     summary: Liste des versions du catalogue avec stats
 */
router.get('/versions', requireAuth, requireAdmin, asyncHandler(async (_req: AuthRequest, res: Response) => {
  const versions = await service.listVersions();
  res.json(versions);
}));

/**
 * @swagger
 * /api/obligations/{id}:
 *   get:
 *     tags: [Obligations]
 *     summary: Detail d'une obligation
 */
router.get('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const o = await service.getObligationById(String(req.params.id));
  if (!o) {
    res.status(404).json({ error: 'Obligation non trouvee' });
    return;
  }
  res.json(o);
}));

/**
 * @swagger
 * /api/obligations:
 *   post:
 *     tags: [Obligations]
 *     summary: Creer une obligation (admin uniquement)
 */
router.post('/', requireAuth, requireAdmin, validate({ body: createObligation }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const created = await service.createObligation(req.body);
  AuditService.log({
    actorId: req.userId!, actorEmail: req.userEmail!,
    action: 'OBLIGATION_CREATED', entityType: 'Obligation', entityId: created.id,
    organizationId: req.orgId, ipAddress: getClientIp(req),
    changes: { code: created.code, version: created.version, libelle: created.libelle },
  });
  res.status(201).json(created);
}));

/**
 * @swagger
 * /api/obligations/{id}:
 *   patch:
 *     tags: [Obligations]
 *     summary: Modifier une obligation (admin uniquement)
 */
router.patch('/:id', requireAuth, requireAdmin, validate({ body: updateObligation }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const updated = await service.updateObligation(String(req.params.id), req.body);
  AuditService.log({
    actorId: req.userId!, actorEmail: req.userEmail!,
    action: 'OBLIGATION_UPDATED', entityType: 'Obligation', entityId: updated.id,
    organizationId: req.orgId, ipAddress: getClientIp(req),
    changes: { fields: Object.keys(req.body) },
  });
  res.json(updated);
}));

/**
 * @swagger
 * /api/obligations/{id}/desactiver:
 *   post:
 *     tags: [Obligations]
 *     summary: Desactiver une obligation (soft delete, admin uniquement)
 */
router.post('/:id/desactiver', requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const updated = await service.deactivateObligation(String(req.params.id));
  AuditService.log({
    actorId: req.userId!, actorEmail: req.userEmail!,
    action: 'OBLIGATION_DEACTIVATED', entityType: 'Obligation', entityId: updated.id,
    organizationId: req.orgId, ipAddress: getClientIp(req),
    changes: { code: updated.code },
  });
  res.json(updated);
}));

router.post('/:id/activer', requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const updated = await service.activateObligation(String(req.params.id));
  AuditService.log({
    actorId: req.userId!, actorEmail: req.userEmail!,
    action: 'OBLIGATION_ACTIVATED', entityType: 'Obligation', entityId: updated.id,
    organizationId: req.orgId, ipAddress: getClientIp(req),
    changes: { code: updated.code },
  });
  res.json(updated);
}));

/**
 * @swagger
 * /api/obligations/cloner-version:
 *   post:
 *     tags: [Obligations]
 *     summary: Dupliquer un catalogue d'une version vers une autre (loi de finances)
 */
router.post('/cloner-version', requireAuth, requireAdmin, validate({ body: cloneVersionBody }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await service.cloneVersion(req.body.fromVersion, req.body.toVersion);
  if (result.cloned > 0) {
    AuditService.log({
      actorId: req.userId!, actorEmail: req.userEmail!,
      action: 'OBLIGATIONS_VERSION_CLONED', entityType: 'Obligation', entityId: 'catalog',
      organizationId: req.orgId, ipAddress: getClientIp(req),
      changes: { fromVersion: req.body.fromVersion, toVersion: req.body.toVersion, cloned: result.cloned },
    });
  }
  res.json(result);
}));

/**
 * @swagger
 * /api/obligations/{id}/tester-applicabilite:
 *   post:
 *     tags: [Obligations]
 *     summary: Verifier si une obligation s'applique a une entite donnee
 */
router.post('/:id/tester-applicabilite', requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { entiteId, anneeFiscale } = req.body as { entiteId?: string; anneeFiscale?: number };
  if (!entiteId) {
    res.status(400).json({ error: "entiteId requis" });
    return;
  }
  const result = await service.testerApplicabilite(String(req.params.id), entiteId, anneeFiscale);
  res.json(result);
}));

export default router;
