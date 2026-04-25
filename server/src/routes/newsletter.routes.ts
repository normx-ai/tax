import { Router, Request, Response } from "express";
import crypto from "crypto";
import prisma from "../utils/prisma";
import { EmailService } from "../services/email.service";
import { createLogger } from "../utils/logger";

const logger = createLogger("Newsletter");
const router = Router();

// Validation simple d'email (RFC 5322 simplifie)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FRONTEND_BASE = process.env.FRONTEND_URL || "https://tax.normx-ai.com";

function genToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// POST /api/newsletter/subscribe
// Body : { email, source? }
router.post("/subscribe", async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const source = String(req.body?.source || "").trim().slice(0, 32) || null;

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Adresse email invalide" });
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });

    if (existing?.status === "CONFIRMED") {
      // Deja inscrit, on ne renvoie rien (et on ne fuite pas l'info)
      return res.json({ ok: true, message: "Si cette adresse n'etait pas encore inscrite, un email de confirmation a ete envoye." });
    }

    let subscriber;
    if (existing) {
      // Re-utilise l'enregistrement existant (PENDING ou UNSUBSCRIBED) en regenerant les tokens
      subscriber = await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          status: "PENDING",
          confirmToken: genToken(),
          unsubscribeToken: genToken(),
          source: source ?? existing.source,
          subscribedAt: new Date(),
          confirmedAt: null,
          unsubscribedAt: null,
        },
      });
    } else {
      subscriber = await prisma.newsletterSubscriber.create({
        data: {
          email,
          status: "PENDING",
          confirmToken: genToken(),
          unsubscribeToken: genToken(),
          source,
        },
      });
    }

    const confirmUrl = `${FRONTEND_BASE}/api/newsletter/confirm?token=${subscriber.confirmToken}`;
    const unsubscribeUrl = `${FRONTEND_BASE}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`;

    await EmailService.sendNewsletterConfirmation(email, confirmUrl, unsubscribeUrl);

    return res.json({ ok: true, message: "Verifiez votre boite mail pour confirmer l'inscription." });
  } catch (err) {
    logger.error("Newsletter subscribe error:", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/newsletter/confirm?token=...
router.get("/confirm", async (req: Request, res: Response) => {
  try {
    const token = String(req.query?.token || "");
    if (!token) {
      return res.status(400).type("text/html").send(htmlPage("Lien invalide", "Le jeton de confirmation est manquant.", false));
    }
    const sub = await prisma.newsletterSubscriber.findUnique({ where: { confirmToken: token } });
    if (!sub) {
      return res.status(404).type("text/html").send(htmlPage("Lien invalide ou expire", "Cette confirmation n'est plus valide. Inscrivez-vous a nouveau si besoin.", false));
    }
    if (sub.status === "CONFIRMED") {
      return res.type("text/html").send(htmlPage("Deja confirme", "Votre inscription est deja active. Merci !", true));
    }
    await prisma.newsletterSubscriber.update({
      where: { id: sub.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });
    return res.type("text/html").send(htmlPage("Inscription confirmee", "Merci ! Vous recevrez nos prochaines newsletters NORMX.", true));
  } catch (err) {
    logger.error("Newsletter confirm error:", err instanceof Error ? err.message : err);
    return res.status(500).type("text/html").send(htmlPage("Erreur", "Une erreur est survenue, reessayez plus tard.", false));
  }
});

// GET /api/newsletter/unsubscribe?token=...
router.get("/unsubscribe", async (req: Request, res: Response) => {
  try {
    const token = String(req.query?.token || "");
    if (!token) {
      return res.status(400).type("text/html").send(htmlPage("Lien invalide", "Le jeton de desinscription est manquant.", false));
    }
    const sub = await prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token } });
    if (!sub) {
      return res.status(404).type("text/html").send(htmlPage("Lien invalide", "Cette desinscription n'est plus valide.", false));
    }
    if (sub.status !== "UNSUBSCRIBED") {
      await prisma.newsletterSubscriber.update({
        where: { id: sub.id },
        data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
      });
    }
    return res.type("text/html").send(htmlPage("Desinscrit", "Vous ne recevrez plus de newsletter NORMX. A bientot !", true));
  } catch (err) {
    logger.error("Newsletter unsubscribe error:", err instanceof Error ? err.message : err);
    return res.status(500).type("text/html").send(htmlPage("Erreur", "Une erreur est survenue, reessayez plus tard.", false));
  }
});

function htmlPage(title: string, message: string, success: boolean): string {
  const accent = success ? "#16a34a" : "#dc2626";
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(title)} — NORMX</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>body{margin:0;padding:48px 16px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Inter,sans-serif;color:#111827}
  .card{max-width:480px;margin:0 auto;background:#fff;padding:40px 32px;text-align:center}
  h1{font-size:22px;color:${accent};margin:0 0 12px}
  p{font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 24px}
  a{display:inline-block;padding:10px 24px;background:#0F2A42;color:#fff;font-weight:700;text-decoration:none}</style>
  </head><body><div class="card"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><a href="https://normx-ai.com">Retour au site</a></div></body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default router;
