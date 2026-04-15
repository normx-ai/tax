-- Migration: Cree la table document_audits pour l'historique des audits de factures
-- Modele Prisma: DocumentAudit (server/prisma/schema.prisma)

CREATE TABLE IF NOT EXISTS "document_audits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "docType" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "conforme" BOOLEAN NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "document_audits_userId_idx" ON "document_audits"("userId");
CREATE INDEX IF NOT EXISTS "document_audits_orgId_idx" ON "document_audits"("orgId");
CREATE INDEX IF NOT EXISTS "document_audits_createdAt_idx" ON "document_audits"("createdAt");
