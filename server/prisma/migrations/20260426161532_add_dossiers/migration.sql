-- Bloc 2.2 — Table dossiers (instances d'obligation par entite x periode)
-- Generee automatiquement par le moteur d'applicabilite (Bloc 2.1).

-- CreateEnum
CREATE TYPE "DossierStatut" AS ENUM ('A_FAIRE', 'EN_COURS', 'PRET', 'DEPOSE', 'PAYE', 'EN_RETARD', 'NON_APPLICABLE');

-- CreateTable
CREATE TABLE "dossiers" (
  "id" TEXT NOT NULL,
  "entiteId" TEXT NOT NULL,
  "obligationId" TEXT NOT NULL,
  "periode" TEXT NOT NULL,
  "dateEcheance" TIMESTAMP(3) NOT NULL,
  "statut" "DossierStatut" NOT NULL DEFAULT 'A_FAIRE',
  "montantCalcule" DECIMAL(20, 2),
  "baseImposable" DECIMAL(20, 2),
  "dateDepot" TIMESTAMP(3),
  "datePaiement" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_entiteId_obligationId_periode_key" ON "dossiers"("entiteId", "obligationId", "periode");

-- CreateIndex
CREATE INDEX "dossiers_entiteId_idx" ON "dossiers"("entiteId");

-- CreateIndex
CREATE INDEX "dossiers_obligationId_idx" ON "dossiers"("obligationId");

-- CreateIndex
CREATE INDEX "dossiers_statut_idx" ON "dossiers"("statut");

-- CreateIndex
CREATE INDEX "dossiers_dateEcheance_idx" ON "dossiers"("dateEcheance");

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_entiteId_fkey" FOREIGN KEY ("entiteId") REFERENCES "entites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
