import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { globalLimiter, sensitiveLimiter, chatLimiter } from "./middleware/rateLimit.middleware";
import chatRoutes from "./routes/chat";
import organizationRoutes from "./routes/organization.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import permissionRoutes from "./routes/permission.routes";
import analyticsRoutes from "./routes/analytics.routes";
import auditRoutes from "./routes/audit.routes";
import alertesFiscalesRoutes from "./routes/alertes-fiscales.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import ingestionRoutes from "./routes/ingestion.routes";
import searchHistoryRoutes from "./routes/search-history.routes";
import userStatsRoutes from "./routes/user-stats.routes";
import notificationRoutes from "./routes/notifications.routes";
import invoiceRoutes from "./routes/invoice.routes";
import auditFactureRoutes from "./routes/audit-facture.routes";
import favoritesRoutes from "./routes/favorites.routes";
import simulatorExportRoutes from "./routes/simulator-export.routes";
import { startReminderCron } from "./services/reminder.service";
import prisma from "./utils/prisma";
import { createLogger } from "./utils/logger";

const logger = createLogger("App");
const app = express();

// Faire confiance au reverse proxy Nginx (B10 — configurable via env)
app.set("trust proxy", parseInt(process.env.TRUST_PROXY || "1", 10));

// Origins autorisées (supporte plusieurs domaines séparés par des virgules)
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3004")
  .split(",")
  .map(o => o.trim());
// En dev, ajouter automatiquement les ports locaux courants
if (process.env.NODE_ENV !== "production") {
  const devOrigins = ["http://localhost:8081", "http://localhost:3000", "http://localhost:3004"];
  devOrigins.forEach(o => { if (!allowedOrigins.includes(o)) allowedOrigins.push(o); });
}

// Middleware sécurité — CSP strict sans unsafe-inline/unsafe-eval (C2)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://challenges.cloudflare.com", "https://*.cloudflare.com"],
      styleSrc: ["'self'", "'sha256-+R/ZCHnQviXyQb4aRG+FfnYnvSs95Sh3781AvYd08wc='", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["https://challenges.cloudflare.com", "https://*.cloudflare.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
    },
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      // Clients sans Origin (mobile natif, curl, monitoring) :
      // autoriser la requête mais sans en-têtes CORS (inutiles pour ces clients)
      callback(null, false);
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} non autorisée par CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Organization-ID", "X-Platform", "X-CSRF-Token"],
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Valider Content-Type sur les requêtes avec body (BP1)
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method) && req.headers["content-length"] !== "0") {
    const ct = req.headers["content-type"];
    if (ct && !ct.includes("application/json") && !ct.includes("multipart/form-data")) {
      res.status(415).json({ error: "Content-Type non supporté, utilisez application/json" });
      return;
    }
  }
  next();
});

// Middleware de logging des requêtes HTTP — masque les query params sensibles (B6)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    // Ne logger que le path sans query parameters pour éviter l'exposition de données
    const safePath = req.path;
    logger.info(`${req.method} ${safePath} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Protection CSRF (double-submit cookie) — apres cookieParser
// CSRF plus necessaire — Keycloak gere la securite des tokens
// app.use(csrfProtection);

// Rate limiting global
app.use(globalLimiter);

// Swagger UI — désactivé en production et staging (B12)
if (process.env.NODE_ENV === "development") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));
}

// Middleware global : verifier la souscription produit "tax" sur toutes les routes /api authentifiees
import { requireAuth, AuthRequest } from "./middleware/keycloak-auth";
import { requireProductSubscription } from "./middleware/product-subscription.middleware";
app.use("/api", (req, res, next) => {
  // Skip les routes publiques (health, docs)
  if (req.path === '/health' || req.path.startsWith('/docs')) return next();
  // Appliquer requireAuth puis requireProductSubscription
  requireAuth(req as AuthRequest, res, (err?: unknown) => {
    if (err) return next(err);
    requireProductSubscription('tax')(req as AuthRequest, res, next);
  });
});

// Routes
app.use("/api/chat", chatLimiter, chatRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/subscription", sensitiveLimiter, subscriptionRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/audit-facture", chatLimiter, auditFactureRoutes);
app.use("/api/alertes-fiscales", alertesFiscalesRoutes);
app.use("/api/user/stats", userStatsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", sensitiveLimiter, adminRoutes);
app.use("/api/ingestion", sensitiveLimiter, ingestionRoutes);
app.use("/api/search-history", searchHistoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/simulator", simulatorExportRoutes);

// Contact form (landing normx-ai.com)
app.post("/api/contact", async (req, res) => {
  try {
    const { nom, prenom, email, sujet, message } = req.body;
    if (!email || !message) return res.status(400).json({ error: "Email et message requis" });
    const { EmailService } = await import("./services/email.service");
    const adminEmail = process.env.ADMIN_EMAIL || "info-contact@normx-ai.com";
    const html = `<h2>Nouveau message de contact — NORMX AI</h2>
      <p><strong>Nom :</strong> ${nom || ""} ${prenom || ""}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Sujet :</strong> ${sujet || "Sans objet"}</p>
      <p><strong>Message :</strong></p>
      <p>${(message || "").replace(/\n/g, "<br>")}</p>`;
    await EmailService.sendGeneric(adminEmail, `[NORMX Contact] ${sujet || "Nouveau message"}`, html);
    res.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Démarrer le cron des rappels (expiration abonnement + échéances fiscales)
startReminderCron();

// Health check — ne retourne que le statut global sans détails internes (B1)
app.get("/health", async (_req, res) => {
  let overall = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    overall = "degraded";
  }

  try {
    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(`${qdrantUrl}/healthz`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) overall = "degraded";
  } catch {
    overall = "degraded";
  }

  const statusCode = overall === "ok" ? 200 : 503;
  res.status(statusCode).json({ status: overall });
});

// Catch-all pour routes /api/* inexistantes — retourne 404 JSON (MED-03)
app.all("/api/{*splat}", (_req, res) => {
  res.status(404).json({ error: "Route API introuvable" });
});

// Gestionnaire d'erreurs global — empêche l'exposition de stack traces (HIGH-01)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("Erreur non gérée:", err);
  if (err.message?.includes("non autorisée par CORS")) {
    res.status(403).json({ error: "Origin non autorisée" });
    return;
  }
  res.status(500).json({ error: "Erreur interne du serveur" });
});

// Servir le frontend web (Expo build) — après les routes API
const webDistPath = path.resolve(__dirname, "../../mobile/dist");
const webIndexPath = path.join(webDistPath, "index.html");

if (fs.existsSync(webIndexPath)) {
  app.use(express.static(webDistPath));
  // SPA fallback : toute route non-API renvoie index.html
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(webIndexPath);
  });
}

export default app;
