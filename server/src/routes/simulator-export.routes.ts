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

    // Header — fond bleu fonce + titre RAPPORT + nom du simulateur
    doc.rect(0, 0, 595, 80).fill(DARK);
    doc.font(FONT_B).fontSize(26).fillColor("#ffffff").text("RAPPORT", 50, 26, { characterSpacing: 2 });
    doc.font(FONT_B).fontSize(13).fillColor(PRIMARY).text(simulatorName, 240, 32, { width: 305, align: "right" });
    doc.font(FONT).fontSize(9).fillColor("#cbd5e1").text(
      `Généré le ${date || new Date().toLocaleDateString("fr-FR")}  |  CGI Congo 2026`,
      240, 52, { width: 305, align: "right" }
    );

    let y = 110;

    // Inputs
    if (inputs && Object.keys(inputs).length > 0) {
      doc.font(FONT_B).fontSize(11).fillColor(DARK).text("PARAMÈTRES", 50, y);
      y += 20;
      for (const [key, val] of Object.entries(inputs)) {
        doc.font(FONT).fontSize(9).fillColor("#6b7280").text(key, 50, y, { width: 250 });
        doc.font(FONT).fontSize(10).fillColor(DARK).text(String(val), 310, y, { width: 230, align: "right" });
        y += 18;
      }
      y += 10;
    }

    // Separator
    doc.moveTo(50, y).lineTo(545, y).strokeColor(PRIMARY).lineWidth(1).stroke();
    y += 15;

    // Results
    doc.font(FONT_B).fontSize(11).fillColor(DARK).text("RÉSULTATS", 50, y);
    y += 22;

    for (const line of results) {
      const isTotal = line.type === "total";
      const isResult = line.type === "result";
      const isHeader = line.type === "header";

      if (isHeader) {
        y += 6;
        doc.font(FONT_B).fontSize(9).fillColor(PRIMARY).text(line.label.toUpperCase(), 50, y);
        y += 16;
        continue;
      }

      if (isTotal) {
        doc.rect(50, y - 4, 495, 22).fill(`${PRIMARY}15`);
      }

      doc.font(isTotal || isResult ? FONT_B : FONT);
      doc.fontSize(isTotal ? 11 : 10).fillColor(isTotal ? DARK : "#374151").text(line.label, 55, y, { width: 280 });
      doc.fontSize(isTotal ? 12 : 10).fillColor(isResult ? "#ef4444" : isTotal ? PRIMARY : DARK).text(line.value, 340, y, { width: 200, align: "right" });
      y += isTotal ? 24 : 18;

      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    }

    // Reference article
    if (reference) {
      y += 20;
      doc.font(FONT).fontSize(8).fillColor("#9ca3af").text(reference, 50, y, { align: "center", width: 495 });
    }

    // Footer
    const footerY = 780;
    doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
    doc.font(FONT).fontSize(7).fillColor("#9ca3af").text(
      "NORMX Tax — Intelligence Fiscale IA | tax.normx-ai.com | Ce document est généré automatiquement et n'a pas de valeur juridique.",
      50, footerY + 8, { align: "center", width: 495 }
    );

    doc.end();
    logger.info(`Export PDF ${simulatorName} par user ${req.userId}`);
  } catch (err) {
    logger.error("Erreur export PDF:", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Erreur generation PDF" });
  }
});

export default router;
