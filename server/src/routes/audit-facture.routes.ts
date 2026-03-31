import { Router } from "express";
import multer from "multer";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { resolveTenant } from "../middleware/tenant.middleware";
import { checkAuditCredits } from "../middleware/subscription.middleware";
import { analyzeInvoice, type DocumentType } from "../services/audit-facture.service";
import prisma from "../utils/prisma";
import { createLogger } from "../utils/logger";

const VALID_DOC_TYPES: DocumentType[] = ["facture", "releve_bancaire", "bon_commande", "das2", "note_frais"];
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

      logger.info(`Audit ${docType} par user ${req.userId}, fichier: ${req.file.originalname} (${req.file.mimetype}, ${(req.file.size / 1024).toFixed(0)} Ko)`);

      const result = await analyzeInvoice(req.file.buffer, req.file.mimetype, docType);

      // Sauvegarder en base
      await prisma.documentAudit.create({
        data: {
          userId: req.userId!,
          orgId: req.orgId || null,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          docType,
          score: result.score.found,
          total: result.score.total,
          conforme: result.score.found === result.score.total,
          result: JSON.parse(JSON.stringify(result)),
        },
      });

      return res.json(result);
    } catch (err) {
      logger.error("Erreur audit facture:", err instanceof Error ? err.message : err);
      return res.status(500).json({ error: "Erreur lors de l'analyse" });
    }
  }
);

// GET /history — Historique des audits
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
        },
      });
      return res.json(audits);
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

export default router;
