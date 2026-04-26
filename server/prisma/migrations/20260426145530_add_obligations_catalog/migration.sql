-- Bloc 1.1 — Catalogue des obligations fiscales du CGI Congolais
-- Une ligne par type d'obligation (ITS, TVA, IS, CFPB, patente, MP...) avec
-- ses regles d'echeance et d'applicabilite. Sert de base pour generer les
-- dossiers (instances par entite x periode) lors de l'inscription d'une
-- entreprise ou d'un client cabinet.

-- CreateEnum
CREATE TYPE "ObligationPeriodicite" AS ENUM ('MENSUELLE', 'BIMENSUELLE', 'TRIMESTRIELLE', 'SEMESTRIELLE', 'ANNUELLE', 'PONCTUELLE');

-- CreateTable
CREATE TABLE "obligations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "categorie" "AlerteCategorie" NOT NULL,
    "periodicite" "ObligationPeriodicite" NOT NULL,
    "echeanceRule" JSONB NOT NULL,
    "applicabilite" JSONB NOT NULL DEFAULT '{}',
    "articleNumero" TEXT,
    "articleId" TEXT,
    "simulateurCode" TEXT,
    "version" TEXT NOT NULL DEFAULT '2026',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obligations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "obligations_categorie_idx" ON "obligations"("categorie");

-- CreateIndex
CREATE INDEX "obligations_version_idx" ON "obligations"("version");

-- CreateIndex
CREATE INDEX "obligations_actif_idx" ON "obligations"("actif");

-- CreateIndex
CREATE INDEX "obligations_periodicite_idx" ON "obligations"("periodicite");

-- CreateIndex
CREATE UNIQUE INDEX "obligations_code_version_key" ON "obligations"("code", "version");

-- AddForeignKey
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
