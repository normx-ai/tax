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
  const iconSvg = success
    ? '<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#dcfce7"/><path d="M8 12.5L11 15.5L16 9.5" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#fee2e2"/><path d="M9 9L15 15M15 9L9 15" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/></svg>';
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
  <title>${escapeHtml(title)} — NORMX AI</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',-apple-system,Segoe UI,sans-serif;color:#1f2937;background:#0F2A42;background-image:radial-gradient(ellipse at top,rgba(212,168,67,.15) 0%,transparent 60%),linear-gradient(180deg,#0F2A42 0%,#1A3A5C 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{max-width:520px;width:100%;background:#fff;padding:0;box-shadow:0 30px 60px rgba(0,0,0,.25);overflow:hidden}
    .header{background:#0F2A42;padding:32px;text-align:center;border-bottom:6px double #D4A843}
    .logo{font-size:26px;font-weight:800;color:#fff;letter-spacing:1px}
    .logo span{color:#D4A843}
    .body{padding:40px 36px 32px;text-align:center}
    .icon{margin:0 auto 16px;width:48px;height:48px}
    h1{font-size:22px;font-weight:800;color:${accent};margin:0 0 14px;letter-spacing:.3px}
    p{font-size:15px;color:#4b5563;line-height:1.65;margin:0 0 28px}
    .cta{display:inline-block;padding:12px 28px;background:#0F2A42;color:#fff;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:.5px;text-transform:uppercase;transition:background .15s}
    .cta:hover{background:#1A3A5C}
    .footer{padding:18px 36px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;line-height:1.6}
  </style>
  </head><body>
  <div class="card">
    <div class="header"><div class="logo">NORMX <span>AI</span></div></div>
    <div class="body">
      <div class="icon">${iconSvg}</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <a class="cta" href="https://normx-ai.com">Retour au site</a>
    </div>
    <div class="footer">NORMX AI SAS — 71 rue Daire, 80000 Amiens<br>info-contact@normx-ai.com</div>
  </div>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default router;
