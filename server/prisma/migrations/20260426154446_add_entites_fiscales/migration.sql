-- Bloc 1.2 — Modele Entite fiscale
-- Une organisation peut avoir 0..N entites. Mode "entreprise" =
-- 1 entite isClientSelf=true. Mode "cabinet" = N entites clients.

-- CreateEnum
CREATE TYPE "SecteurActivite" AS ENUM (
  'AERIEN',
  'AGRI_FORET',
  'AUXILIAIRES_TRANSPORT',
  'BAM',
  'BTP',
  'COMMERCE',
  'EXPLOITATION_MINIERE',
  'FORESTIERE',
  'HOTELLERIE_CATERING',
  'INDUSTRIE',
  'INFORMATION_COMMUNICATION',
  'NTIC',
  'PARA_PETROLE',
  'PECHE_MARITIME',
  'PERSONNEL_DOMESTIQUE',
  'PETROLE'
);

-- CreateEnum
CREATE TYPE "FormeJuridique" AS ENUM (
  'EI',
  'SARL',
  'SARLU',
  'SA',
  'SAS',
  'SASU',
  'SNC',
  'SCS',
  'SOCIETE_PARTICIPATION',
  'GIE',
  'SCI',
  'ASSOCIATION',
  'AUTRE'
);

-- CreateEnum
CREATE TYPE "RegimeIS" AS ENUM (
  'REEL_NORMAL',
  'REEL_SIMPLIFIE',
  'MICRO',
  'EXONERE'
);

-- CreateEnum
CREATE TYPE "RegimeTVA" AS ENUM (
  'REEL',
  'FRANCHISE',
  'EXONERE',
  'NON_ASSUJETTI'
);

-- CreateTable
CREATE TABLE "entites" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "raisonSociale" TEXT NOT NULL,
  "sigle" TEXT,
  "niu" TEXT,
  "rccm" TEXT,
  "adresse" TEXT,
  "ville" TEXT,
  "telephone" TEXT,
  "email" TEXT,
  "formeJuridique" "FormeJuridique" NOT NULL,
  "secteurActivite" "SecteurActivite" NOT NULL,
  "regimeIs" "RegimeIS" NOT NULL,
  "regimeTva" "RegimeTVA" NOT NULL,
  "estEmployeur" BOOLEAN NOT NULL DEFAULT false,
  "effectifSalaries" INTEGER NOT NULL DEFAULT 0,
  "possedeFoncierBati" BOOLEAN NOT NULL DEFAULT false,
  "possedeFoncierNonBati" BOOLEAN NOT NULL DEFAULT false,
  "caEstimeAnneeCourante" DECIMAL(20, 2),
  "caRealiseAnneeN1" DECIMAL(20, 2),
  "dateCreation" TIMESTAMP(3),
  "dateClotureExercice" TEXT,
  "isClientSelf" BOOLEAN NOT NULL DEFAULT false,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "entites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entites_organizationId_idx" ON "entites"("organizationId");

-- CreateIndex
CREATE INDEX "entites_secteurActivite_idx" ON "entites"("secteurActivite");

-- CreateIndex
CREATE INDEX "entites_actif_idx" ON "entites"("actif");

-- CreateIndex
CREATE INDEX "entites_isClientSelf_idx" ON "entites"("isClientSelf");

-- AddForeignKey
ALTER TABLE "entites" ADD CONSTRAINT "entites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
