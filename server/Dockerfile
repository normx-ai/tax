# ==========================================
# CGI-242 Backend — Multi-stage Dockerfile
# ==========================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/
COPY prisma/ prisma/

RUN npx prisma generate
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Dépendances de production uniquement
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Prisma client généré
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Code compilé
COPY --from=builder /app/dist ./dist

# Prisma schema + migrations
COPY prisma/ prisma/

# Données statiques (articles CGI)
COPY data/ data/

# Schema template tenant
COPY src/db/tenant-schema.sql dist/db/tenant-schema.sql

# Assets statiques (fonts Inter + logo) utilises par les routes PDF
COPY src/assets dist/assets

# Fichiers JSON de test/scripts (cas de couverture RAG, etc.)
COPY src/scripts/*.json dist/scripts/

# Dossier pour les factures PDF
RUN mkdir -p /app/storage/invoices && chown -R node:node /app/storage

# Sécurité : ne pas exécuter en root (H1)
USER node

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1

EXPOSE 3003

# Migrations Prisma + démarrage
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
