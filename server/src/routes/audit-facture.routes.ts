import { Router } from "express";
import multer from "multer";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { resolveTenant } from "../middleware/tenant.middleware";
import { checkAuditCredits, confirmCreditUsage } from "../middleware/subscription.middleware";
import { analyzeInvoice, ALL_AXES, type DocumentType, type AuditAxe } from "../services/audit-facture.service";
import prisma from "../utils/prisma";
import { createLogger } from "../utils/logger";

const VALID_DOC_TYPES: DocumentType[] = ["facture", "contrat"];
const logger = createLogger("AuditFacture");
const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format non supporte. Utilisez PDF, JPEG ou PNG."));
    }
  },
});

// POST / — Analyser un document
router.post(
  "/",
  requireAuth,
  resolveTenant,
  checkAuditCredits,
  upload.single("file"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }

      const docType = (req.body?.type as DocumentType) || "facture";
      if (!VALID_DOC_TYPES.includes(docType)) {
        return res.status(400).json({ error: "Type de document invalide" });
      }

      // Axes cibles (optionnel). Accepte une liste separee par virgules
      // (ex: "langue,mentions") ou un JSON string. Valeurs invalides ignorees.
      const rawAxes = typeof req.body?.axes === "string" ? req.body.axes : "";
      let axes: AuditAxe[] | undefined;
      if (rawAxes) {
        try {
          const parsed = rawAxes.trim().startsWith("[") ? JSON.parse(rawAxes) : rawAxes.split(",");
          if (Array.isArray(parsed)) {
            axes = parsed
              .map((a) => String(a).trim())
              .filter((a): a is AuditAxe => ALL_AXES.includes(a as AuditAxe));
          }
        } catch {
          // Format invalide : on retombe sur l'audit complet.
        }
      }

      // Multer decode les noms de fichiers multipart en latin1 alors que les
      // navigateurs envoient de l'UTF-8. On reinterprete les octets pour
      // restaurer les accents (é, è, à, ô...).
      const fileName = Buffer.from(req.file.originalname, "latin1").toString("utf8");

      const axesLog = axes && axes.length > 0 ? ` [axes: ${axes.join(",")}]` : "";
      logger.info(`Audit ${docType} par user ${req.userId}, fichier: ${fileName} (${req.file.mimetype}, ${(req.file.size / 1024).toFixed(0)} Ko)${axesLog}`);

      const result = await analyzeInvoice(req.file.buffer, req.file.mimetype, docType, axes);

      // Conforme global : tous les axes doivent etre conformes, pas uniquement le score
      // des mentions. Une facture en anglais ou avec un mauvais taux TVA n'est pas
      // conforme meme si toutes les mentions sont presentes.
      const conformeGlobal =
        result.score.found === result.score.total &&
        result.langue.conforme !== false &&
        result.tva.conforme !== false &&
        (result.risques?.length ?? 0) === 0;

      // Sauvegarder en base
      await prisma.documentAudit.create({
        data: {
          userId: req.userId!,
          orgId: req.orgId || null,
          fileName,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          docType,
          score: result.score.found,
          total: result.score.total,
          conforme: conformeGlobal,
          result: JSON.parse(JSON.stringify(result)),
        },
      });

      // L'audit a reussi et est sauvegarde : on debite les credits
      await confirmCreditUsage(req);

      return res.json(result);
    } catch (err) {
      logger.error("Erreur audit facture:", err instanceof Error ? err.message : err);
      // Echec : pas de debit de credit (reservation annulee implicitement)
      return res.status(500).json({ error: "Erreur lors de l'analyse" });
    }
  }
);

// GET /history — Historique des audits
// Recalcule le flag conforme depuis le result stocke pour corriger les
// anciens enregistrements ou seul le score etait pris en compte.
router.get(
  "/history",
  requireAuth,
  resolveTenant,
  async (req: AuthRequest, res) => {
    try {
      const audits = await prisma.documentAudit.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          fileName: true,
          docType: true,
          score: true,
          total: true,
          conforme: true,
          createdAt: true,
          result: true,
        },
      });
      const payload = audits.map((a) => {
        const r = a.result as {
          langue?: { conforme?: boolean };
          tva?: { conforme?: boolean };
          risques?: unknown[];
        } | null;
        const conformeGlobal = r
          ? a.score === a.total &&
            r.langue?.conforme !== false &&
            r.tva?.conforme !== false &&
            (r.risques?.length ?? 0) === 0
          : a.conforme;
        return {
          id: a.id,
          fileName: a.fileName,
          docType: a.docType,
          score: a.score,
          total: a.total,
          conforme: conformeGlobal,
          createdAt: a.createdAt,
        };
      });
      return res.json(payload);
    } catch (err) {
      logger.error("Erreur historique audit:", err instanceof Error ? err.message : err);
      return res.status(500).json({ error: "Erreur chargement historique" });
    }
  }
);

// GET /:id — Détail d'un audit
router.get(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const audit = await prisma.documentAudit.findFirst({
        where: { id: String(req.params.id), userId: req.userId! },
      });
      if (!audit) return res.status(404).json({ error: "Audit introuvable" });
      return res.json(audit);
    } catch (err) {
      logger.error("Erreur detail audit:", err instanceof Error ? err.message : err);
      return res.status(500).json({ error: "Erreur chargement audit" });
    }
  }
);

// DELETE /history — Efface tout l'historique de l'utilisateur courant
router.delete(
  "/history",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const { count } = await prisma.documentAudit.deleteMany({
        where: { userId: req.userId! },
      });
      return res.json({ deleted: count });
    } catch (err) {
      logger.error("Erreur effacement historique:", err instanceof Error ? err.message : err);
      return res.status(500).json({ error: "Erreur effacement historique" });
    }
  }
);

// DELETE /:id — Supprime un audit specifique
router.delete(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const { count } = await prisma.documentAudit.deleteMany({
        where: { id: String(req.params.id), userId: req.userId! },
      });
      if (count === 0) return res.status(404).json({ error: "Audit introuvable" });
      return res.json({ deleted: count });
    } catch (err) {
      logger.error("Erreur suppression audit:", err instanceof Error ? err.message : err);
      return res.status(500).json({ error: "Erreur suppression audit" });
    }
  }
);

export default router;
