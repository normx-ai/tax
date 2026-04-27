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
const TEXT = "#1f2937";
const TEXT_MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const BG_SOFT = "#f9fafb";

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

router.post("/export-pdf", requireAuth, resolveTenant, async (req: AuthRequest, res: Response) => {
  try {
    const { simulatorName, inputs, results, reference, date } = req.body as ExportRequest;

    if (!simulatorName || !results || !Array.isArray(results)) {
      return res.status(400).json({ error: "Donnees manquantes" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 0 });

    if (fs.existsSync(FONT_REG)) doc.registerFont("Inter", FONT_REG);
    if (fs.existsSync(FONT_BOLD)) doc.registerFont("Inter-Bold", FONT_BOLD);
    const FONT = fs.existsSync(FONT_REG) ? "Inter" : "Helvetica";
    const FONT_B = fs.existsSync(FONT_BOLD) ? "Inter-Bold" : "Helvetica-Bold";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="simulation-${simulatorName}-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Bande superieure ultra-fine (5px d'or pour rappel de marque)
    doc.rect(0, 0, 595, 4).fill(PRIMARY);

    // En-tete avec titre + meta
    doc.font(FONT_B).fontSize(9).fillColor(TEXT_MUTED).text("NORMX TAX", 50, 20, { characterSpacing: 1.5 });
    doc.font(FONT).fontSize(8).fillColor(TEXT_MUTED).text(
      `${date || new Date().toLocaleDateString("fr-FR")}  ·  CGI Congo 2026`,
      50, 20, { width: 495, align: "right" }
    );

    doc.font(FONT_B).fontSize(18).fillColor(TEXT).text(simulatorName, 50, 38, { width: 495 });

    // Identifie la ligne "total" (le resultat principal a mettre en hero)
    const totalLine = results.find((l) => l.type === "total");
    const otherResults = results.filter((l) => l !== totalLine);

    let y = 75;

    // HERO — fond bleu nuit avec le total mis en valeur
    if (totalLine) {
      const heroH = 80;
      doc.rect(50, y, 495, heroH).fill(DARK);
      doc.font(FONT_B).fontSize(8.5).fillColor(PRIMARY).text(
        totalLine.label.toUpperCase(),
        70, y + 16, { width: 455, characterSpacing: 1.2 }
      );
      doc.font(FONT_B).fontSize(28).fillColor("#ffffff").text(
        totalLine.value,
        70, y + 32, { width: 410 }
      );
      doc.font(FONT).fontSize(9).fillColor("#cbd5e1").text(
        "FCFA",
        70, y + 50, { width: 410 }
      );
      // Badge "result" eventuel a droite (taux effectif, etc.)
      const resultLine = otherResults.find((l) => l.type === "result");
      if (resultLine) {
        doc.font(FONT).fontSize(8).fillColor("#cbd5e1").text(
          resultLine.label,
          340, y + 18, { width: 185, align: "right", characterSpacing: 0.4 }
        );
        doc.font(FONT_B).fontSize(13).fillColor(PRIMARY).text(
          resultLine.value,
          340, y + 32, { width: 185, align: "right" }
        );
      }
      y += heroH + 14;
    }

    // Compression dynamique pour rester sur une page
    const inputsCount = inputs ? Object.keys(inputs).length : 0;
    const estimatedLines = inputsCount + otherResults.length + 6;
    const tier = estimatedLines > 42 ? "ultra" : estimatedLines > 26 ? "compact" : "normal";
    const rowH = tier === "ultra" ? 13 : tier === "compact" ? 15 : 18;
    const fontSizeBody = tier === "ultra" ? 8 : tier === "compact" ? 9 : 10;
    const headerGap = tier === "ultra" ? 8 : 10;

    const MAX_Y = 770;

    // PARAMETRES — petite carte claire a 2 colonnes
    if (inputs && inputsCount > 0 && y < MAX_Y) {
      doc.font(FONT_B).fontSize(8.5).fillColor(TEXT_MUTED).text(
        "PARAMÈTRES DE LA SIMULATION", 50, y, { characterSpacing: 1.2 }
      );
      y += 14;

      const cardStartY = y;
      const entries = Object.entries(inputs);
      const cols = 2;
      const colW = (495 - 16) / cols;
      const rowsCount = Math.ceil(entries.length / cols);
      const cardH = rowsCount * (tier === "ultra" ? 18 : 22) + 12;

      doc.rect(50, y, 495, cardH).fillAndStroke(BG_SOFT, BORDER);

      entries.forEach(([key, val], i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 50 + 12 + col * (colW + 8);
        const cellY = cardStartY + 8 + row * (tier === "ultra" ? 18 : 22);
        doc.font(FONT).fontSize(7.5).fillColor(TEXT_MUTED).text(key, x, cellY, { width: colW - 16 });
        doc.font(FONT_B).fontSize(fontSizeBody).fillColor(TEXT).text(String(val), x, cellY + 9, { width: colW - 16 });
      });

      y += cardH + 14;
    }

    // DECOMPOSITION DU CALCUL
    if (otherResults.length > 0 && y < MAX_Y) {
      doc.font(FONT_B).fontSize(8.5).fillColor(TEXT_MUTED).text(
        "DÉCOMPOSITION DU CALCUL", 50, y, { characterSpacing: 1.2 }
      );
      y += 14;

      // Bordure exterieure de la table
      const tableStartY = y;
      let tableEndY = y;

      let zebraIdx = 0;
      for (const line of otherResults) {
        if (y >= MAX_Y - 16) break;
        const isResult = line.type === "result";
        const isHeader = line.type === "header";

        if (isHeader) {
          y += 4;
          doc.font(FONT_B).fontSize(7.5).fillColor(PRIMARY).text(
            line.label.toUpperCase(), 60, y, { characterSpacing: 1, width: 475 }
          );
          y += headerGap;
          zebraIdx = 0;
          continue;
        }

        // Skip la ligne "result" deja affichee dans le hero
        if (isResult && totalLine) continue;

        // Zebra background (clair)
        if (zebraIdx % 2 === 1) {
          doc.rect(50, y - 3, 495, rowH).fill(BG_SOFT);
        }

        const isNegative = line.value.trim().startsWith("-") || line.value.trim().startsWith("−");
        const valColor = isResult ? PRIMARY : isNegative ? "#9ca3af" : TEXT;

        doc.font(FONT).fontSize(fontSizeBody).fillColor(TEXT_MUTED).text(line.label, 60, y, { width: 285 });
        doc.font(isResult ? FONT_B : FONT).fontSize(fontSizeBody).fillColor(valColor).text(
          line.value, 350, y, { width: 185, align: "right" }
        );

        // Separateur fin
        doc.moveTo(50, y + rowH - 2).lineTo(545, y + rowH - 2).strokeColor(BORDER).lineWidth(0.4).stroke();

        y += rowH;
        zebraIdx++;
        tableEndY = y;
      }

      // Bordure exterieure
      doc.rect(50, tableStartY - 2, 495, tableEndY - tableStartY + 4).strokeColor(BORDER).lineWidth(0.6).stroke();

      y += 8;
    }

    // Reference article
    if (reference && y < MAX_Y) {
      doc.font(FONT).fontSize(7.5).fillColor(TEXT_MUTED).text(
        `Base juridique : ${reference}`, 50, y, { align: "center", width: 495 }
      );
    }

    // Footer
    const footerY = 805;
    doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor(BORDER).lineWidth(0.5).stroke();
    doc.font(FONT_B).fontSize(7.5).fillColor(DARK).text("NORMX Tax", 50, footerY + 8, { width: 165 });
    doc.font(FONT).fontSize(7).fillColor(TEXT_MUTED).text(
      "Intelligence Fiscale IA — tax.normx-ai.com",
      50, footerY + 8, { width: 495, align: "center" }
    );
    doc.font(FONT).fontSize(7).fillColor(TEXT_MUTED).text(
      "Document généré automatiquement, sans valeur juridique",
      50, footerY + 8, { width: 495, align: "right" }
    );

    doc.end();
    logger.info(`Export PDF ${simulatorName} par user ${req.userId}`);
  } catch (err) {
    logger.error("Erreur export PDF:", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Erreur generation PDF" });
  }
});

export default router;
