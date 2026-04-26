-- Bloc 1.3 — Mode entreprise vs cabinet
-- ENTREPRISE : 1 entite isClientSelf=true, creee a l'onboarding.
-- CABINET    : N entites clients suivies par le cabinet.

-- CreateEnum
CREATE TYPE "OrganizationMode" AS ENUM ('ENTREPRISE', 'CABINET');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "mode" "OrganizationMode" NOT NULL DEFAULT 'ENTREPRISE';
