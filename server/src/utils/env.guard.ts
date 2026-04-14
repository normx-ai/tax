/**
 * Validation des variables d'environnement critiques au demarrage.
 *
 * Si une variable requise manque en production, le processus crash
 * immediatement avec un message clair au lieu de demarrer dans un
 * etat casse et de generer des erreurs obscures plus tard.
 *
 * Doit etre appele APRES `dotenv/config` et AVANT tout code applicatif.
 */

import { createLogger } from "./logger";

const logger = createLogger("EnvGuard");

// Variables absolument requises en production.
// Si l'une manque, le serveur refuse de demarrer.
const REQUIRED_IN_PRODUCTION = [
  // Base de donnees
  "DATABASE_URL",
  // Auth JWT applicative
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  // Auth Keycloak SSO
  "KEYCLOAK_URL",
  "KEYCLOAK_REALM",
  // IA (chat, audit facture, RAG)
  "ANTHROPIC_API_KEY",
  "VOYAGE_API_KEY",
  "QDRANT_URL",
  // Email transactionnel (reset password, confirmations)
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  // Anti-bot (signup, contact)
  "TURNSTILE_SECRET_KEY",
  // HMAC mobile API
  "MOBILE_API_SECRET",
] as const;

// Variables recommandees mais non bloquantes (on log un warning si absentes)
const RECOMMENDED_IN_PRODUCTION = [
  "BASE_URL",
  "FRONTEND_URL",
  "CORS_ORIGIN",
  "ADMIN_EMAIL",
] as const;

export function validateEnv(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const missing = REQUIRED_IN_PRODUCTION.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error(
      "[FATAL] Variables d'environnement requises manquantes au boot. " +
      "Verifiez GitHub Actions secrets et le workflow deploy.yml.",
      { missing },
    );
    // eslint-disable-next-line no-console
    console.error("[FATAL] Missing required env vars:", missing);
    process.exit(1);
  }

  const warnings = RECOMMENDED_IN_PRODUCTION.filter((k) => !process.env[k]);
  if (warnings.length > 0) {
    logger.warn("Variables recommandees absentes (non-bloquant)", { warnings });
  }

  logger.info("Validation env OK : toutes les variables critiques sont presentes");
}
