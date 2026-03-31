-- Migration: Système de crédits (remplace quotas questions)
-- Plans: FREE (10 credits total, 7j essai), STARTER (60/mois), PRO (250/mois)

-- 1. Ajouter les nouveaux champs à subscriptions
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "creditsPerMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "creditsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "creditsTotal" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "creditsPurchased" INTEGER NOT NULL DEFAULT 0;

-- 2. Migrer les données existantes
UPDATE "subscriptions" SET
  "creditsPerMonth" = CASE
    WHEN plan = 'STARTER' THEN 60
    WHEN plan = 'PRO' THEN 250
    WHEN plan = 'PROFESSIONAL' THEN 250
    WHEN plan = 'TEAM' THEN 250
    WHEN plan = 'ENTERPRISE' THEN 250
    ELSE 0
  END,
  "creditsTotal" = CASE
    WHEN plan = 'FREE' THEN 10
    ELSE 0
  END;

-- 3. Migrer les plans PROFESSIONAL/TEAM/ENTERPRISE vers PRO
-- D'abord ajouter PRO à l'enum si pas encore fait
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'PRO';

-- Migrer les abonnements existants
UPDATE "subscriptions" SET plan = 'PRO' WHERE plan IN ('PROFESSIONAL', 'TEAM', 'ENTERPRISE');

-- 4. Renommer questionsUsed en creditsUsed dans organization_members
ALTER TABLE "organization_members" RENAME COLUMN "questionsUsed" TO "creditsUsed";

-- 5. Supprimer les anciens champs de subscriptions
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "questionsPerMonth";
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "questionsUsed";
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "maxMembers";
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "paidSeats";

-- 6. Nettoyer l'enum (supprimer les anciennes valeurs)
-- Note: PostgreSQL ne permet pas de supprimer des valeurs d'enum directement
-- On laisse les anciennes valeurs dans l'enum, elles ne seront plus utilisées
