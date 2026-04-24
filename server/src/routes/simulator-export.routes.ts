import { Router, Response } from "express";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { resolveTenant } from "../middleware/tenant.middleware";
import { createLogger } from "../utils/logger";

const logger = createLogger("SimulatorExport");
const router = Router();

const PRIMARY = "#D4A843";
const DARK = "#0F2A42";

// Chemins assets (fonts Inter pour supporter les accents, logo blanc pour header fonce)
const FONT_REG = path.join(__dirname, "..", "assets", "fonts", "Inter-Regular.ttf");
const FONT_BOLD = path.join(__dirname, "..", "assets", "fonts", "Inter-Bold.ttf");

interface SimulatorLine {
  label: string;
  value: string;
  type?: "header" | "normal" | "result" | "total";
}

interface ExportRequest {
  simulatorName: string;
  inputs: Record<string, string>;
  results: SimulatorLine[];
  reference?: string;
  date?: string;
}

// POST /api/simulator/export-pdf
router.post("/export-pdf", requireAuth, resolveTenant, async (req: AuthRequest, res: Response) => {
  try {
    const { simulatorName, inputs, results, reference, date } = req.body as ExportRequest;

    if (!simulatorName || !results || !Array.isArray(results)) {
      return res.status(400).json({ error: "Donnees manquantes" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Enregistrer les polices Inter (supportent les accents francais)
    if (fs.existsSync(FONT_REG)) doc.registerFont("Inter", FONT_REG);
    if (fs.existsSync(FONT_BOLD)) doc.registerFont("Inter-Bold", FONT_BOLD);
    const FONT = fs.existsSync(FONT_REG) ? "Inter" : "Helvetica";
    const FONT_B = fs.existsSync(FONT_BOLD) ? "Inter-Bold" : "Helvetica-Bold";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="simulation-${simulatorName}-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Header compacte — fond bleu fonce + titre RAPPORT + nom du simulateur
    doc.rect(0, 0, 595, 60).fill(DARK);
    doc.font(FONT_B).fontSize(20).fillColor("#ffffff").text("RAPPORT", 50, 20, { characterSpacing: 2 });
    doc.font(FONT_B).fontSize(12).fillColor(PRIMARY).text(simulatorName, 240, 22, { width: 305, align: "right" });
    doc.font(FONT).fontSize(8).fillColor("#cbd5e1").text(
      `Généré le ${date || new Date().toLocaleDateString("fr-FR")}  |  CGI Congo 2026`,
      240, 40, { width: 305, align: "right" }
    );

    // Calcul dynamique pour garder le rapport sur une page.
    // 3 niveaux de compression selon le nombre estime de lignes.
    const inputsCount = inputs ? Object.keys(inputs).length : 0;
    const estimatedLines = inputsCount + results.length + 6;
    const tier = estimatedLines > 42 ? "ultra" : estimatedLines > 26 ? "compact" : "normal";
    const inputLineHeight = tier === "ultra" ? 11 : tier === "compact" ? 13 : 16;
    const resultLineHeight = tier === "ultra" ? 12 : tier === "compact" ? 14 : 16;
    const totalLineHeight = tier === "ultra" ? 15 : tier === "compact" ? 18 : 22;
    const bodyFontSize = tier === "ultra" ? 7.5 : tier === "compact" ? 8.5 : 10;
    const totalFontSize = tier === "ultra" ? 9 : tier === "compact" ? 10 : 11;
    const headerGap = tier === "ultra" ? 9 : tier === "compact" ? 11 : 14;

    // Le footer reserve une bande fixe en bas (30 px).
    // On dessine le contenu entre y=75 et y=780 pour toujours laisser
    // la place au footer sur la meme page.
    const MAX_Y = 780;

    let y = 75;

    // Inputs
    if (inputs && inputsCount > 0 && y < MAX_Y) {
      doc.font(FONT_B).fontSize(10).fillColor(DARK).text("PARAMÈTRES", 50, y);
      y += 14;
      for (const [key, val] of Object.entries(inputs)) {
        if (y >= MAX_Y) break;
        doc.font(FONT).fontSize(bodyFontSize).fillColor("#6b7280").text(key, 50, y, { width: 250 });
        doc.font(FONT).fontSize(bodyFontSize).fillColor(DARK).text(String(val), 310, y, { width: 230, align: "right" });
        y += inputLineHeight;
      }
      y += 4;
    }

    // Separator
    if (y < MAX_Y) {
      doc.moveTo(50, y).lineTo(545, y).strokeColor(PRIMARY).lineWidth(1).stroke();
      y += 8;
    }

    // Results
    if (y < MAX_Y) {
      doc.font(FONT_B).fontSize(10).fillColor(DARK).text("RÉSULTATS", 50, y);
      y += 14;
    }

    for (const line of results) {
      if (y >= MAX_Y) break;
      const isTotal = line.type === "total";
      const isResult = line.type === "result";
      const isHeader = line.type === "header";

      if (isHeader) {
        y += 2;
        doc.font(FONT_B).fontSize(8.5).fillColor(PRIMARY).text(line.label.toUpperCase(), 50, y);
        y += headerGap;
        continue;
      }

      if (isTotal) {
        doc.rect(50, y - 3, 495, totalLineHeight - 2).fill(`${PRIMARY}15`);
      }

      doc.font(isTotal || isResult ? FONT_B : FONT);
      doc.fontSize(isTotal ? totalFontSize : bodyFontSize).fillColor(isTotal ? DARK : "#374151").text(line.label, 55, y, { width: 280 });
      doc.fontSize(isTotal ? totalFontSize + 1 : bodyFontSize).fillColor(isResult ? "#ef4444" : isTotal ? PRIMARY : DARK).text(line.value, 340, y, { width: 200, align: "right" });
      y += isTotal ? totalLineHeight : resultLineHeight;
    }

    // Reference article (sur la meme page)
    if (reference && y < MAX_Y - 12) {
      y += 8;
      doc.font(FONT).fontSize(7.5).fillColor("#9ca3af").text(reference, 50, y, { align: "center", width: 495 });
    }

    // Footer en bas de la page courante (toujours page 1)
    const footerY = 800;
    doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
    doc.font(FONT).fontSize(7).fillColor("#9ca3af").text(
      "NORMX Tax — Intelligence Fiscale IA | tax.normx-ai.com | Ce document est généré automatiquement et n'a pas de valeur juridique.",
      50, footerY + 6, { align: "center", width: 495 }
    );

    doc.end();
    logger.info(`Export PDF ${simulatorName} par user ${req.userId}`);
  } catch (err) {
    logger.error("Erreur export PDF:", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Erreur generation PDF" });
  }
});

export default router;
