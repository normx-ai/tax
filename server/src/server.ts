import "dotenv/config";

import { validateEnv } from "./utils/env.guard";

// Verifie les variables critiques AVANT de toucher au reste de l'app.
// En production, crash immediatement si une variable requise manque.
validateEnv();

import app from "./app";
import prisma from "./utils/prisma";
import { initializeCollection } from "./services/rag/qdrant.service";
import { createLogger } from "./utils/logger";

const logger = createLogger("Server");
const PORT = Number(process.env.PORT) || 3004;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const server = app.listen(PORT, async () => {
  logger.info(`Serveur démarré sur ${BASE_URL}`);
  logger.info(`Environnement: ${process.env.NODE_ENV}`);
  logger.info(`API:      ${BASE_URL}/api`);
  logger.info(`Swagger:  ${BASE_URL}/api/docs`);
  logger.info(`Frontend: ${BASE_URL}`);

  // Initialiser la collection Qdrant (non-bloquant)
  try {
    await initializeCollection();
    logger.info("Qdrant initialisé");
  } catch (error) {
    logger.warn("Qdrant non disponible:", error);
  }
});

// Graceful shutdown — fermer proprement le serveur HTTP et la connexion Prisma (B9)
function gracefulShutdown(signal: string) {
  logger.info(`${signal} reçu — arrêt gracieux en cours...`);

  // Arrêter d'accepter de nouvelles connexions
  server.close(async () => {
    logger.info("Serveur HTTP fermé — toutes les connexions terminées");
    try {
      await prisma.$disconnect();
      logger.info("Connexion Prisma fermée");
    } catch (err) {
      logger.error("Erreur fermeture Prisma:", err);
    }
    process.exit(0);
  });

  // Couper les connexions keep-alive en cours pour accélérer le drain (B9)
  server.closeAllConnections?.();

  // Forcer l'arrêt après 30s pour les requêtes streaming longues
  setTimeout(() => {
    logger.error("Arrêt forcé après timeout de 30s");
    process.exit(1);
  }, 30_000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
