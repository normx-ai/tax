// Service Dossiers (Bloc 2.2 + 2.1) — gestion des instances d'obligation
// pour une entite x periode + recalcul automatique a partir du moteur
// d'applicabilite.

import prisma from "../utils/prisma";
import { createLogger } from "../utils/logger";
import type { Prisma, DossierStatut } from "@prisma/client";
import {
  entiteToProfil,
  filtrerObligationsApplicables,
  genererPeriodes,
} from "./applicabilite.service";

const logger = createLogger("DossiersService");

export interface ListDossiersFilters {
  entiteId?: string;
  statut?: DossierStatut;
  obligationCode?: string;
  dateMin?: Date;
  dateMax?: Date;
  page?: number;
  limit?: number;
}

export async function listDossiersByOrg(orgId: string, filters: ListDossiersFilters = {}) {
  const where: Prisma.DossierWhereInput = {
    entite: { organizationId: orgId, actif: true },
  };
  if (filters.entiteId) where.entiteId = filters.entiteId;
  if (filters.statut) where.statut = filters.statut;
  if (filters.obligationCode) where.obligation = { code: filters.obligationCode };
  if (filters.dateMin || filters.dateMax) {
    where.dateEcheance = {};
    if (filters.dateMin) where.dateEcheance.gte = filters.dateMin;
    if (filters.dateMax) where.dateEcheance.lte = filters.dateMax;
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 100;

  const [items, total] = await prisma.$transaction([
    prisma.dossier.findMany({
      where,
      include: {
        entite: { select: { id: true, raisonSociale: true, sigle: true } },
        obligation: { select: { id: true, code: true, libelle: true, categorie: true, periodicite: true, simulateurCode: true } },
      },
      orderBy: [{ dateEcheance: "asc" }, { entite: { raisonSociale: "asc" } }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dossier.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getDossierById(orgId: string, id: string) {
  return prisma.dossier.findFirst({
    where: {
      id,
      entite: { organizationId: orgId },
    },
    include: {
      entite: true,
      obligation: true,
    },
  });
}

export interface UpdateDossierInput {
  statut?: DossierStatut;
  montantCalcule?: number | null;
  baseImposable?: number | null;
  dateDepot?: Date | null;
  datePaiement?: Date | null;
  notes?: string | null;
}

export async function updateDossier(orgId: string, id: string, input: UpdateDossierInput) {
  const existing = await getDossierById(orgId, id);
  if (!existing) throw new Error("Dossier non trouvé");
  return prisma.dossier.update({ where: { id }, data: input as Prisma.DossierUpdateInput });
}

/**
 * Recalcule les dossiers applicables pour une entite et une annee fiscale.
 * Pattern :
 * - Charge le profil de l'entite
 * - Charge le catalogue des obligations actives pour l'annee
 * - Filtre par applicabilite
 * - Pour chaque (obligation, periode), upsert le dossier (si absent, cree)
 * - Marque NON_APPLICABLE les dossiers existants dont l'obligation n'est
 *   plus applicable (le profil de l'entite a change)
 */
export async function recalculerDossiers(entiteId: string, anneeFiscale = new Date().getFullYear()) {
  const entite = await prisma.entite.findUnique({ where: { id: entiteId } });
  if (!entite) throw new Error("Entité non trouvée");

  const profil = entiteToProfil(entite);
  const version = String(anneeFiscale);

  const obligations = await prisma.obligation.findMany({
    where: { actif: true, version },
  });

  const applicables = filtrerObligationsApplicables(obligations, profil);
  const idsApplicables = new Set(applicables.map(o => o.id));

  let crees = 0;
  for (const obligation of applicables) {
    const periodes = genererPeriodes(obligation.echeanceRule as never, anneeFiscale);
    for (const { periode, dateEcheance } of periodes) {
      try {
        await prisma.dossier.upsert({
          where: {
            entiteId_obligationId_periode: {
              entiteId,
              obligationId: obligation.id,
              periode,
            },
          },
          update: {}, // Ne touche pas aux dossiers existants
          create: {
            entiteId,
            obligationId: obligation.id,
            periode,
            dateEcheance,
            statut: "A_FAIRE",
          },
        });
        crees++;
      } catch (err) {
        logger.warn(`Upsert dossier echoue : ${entiteId} / ${obligation.code} / ${periode}`);
      }
    }
  }

  // Marque NON_APPLICABLE les dossiers dont l'obligation n'est plus applicable
  // (profil de l'entite a change). On ne touche pas aux dossiers DEPOSE/PAYE.
  const obsoletes = await prisma.dossier.findMany({
    where: {
      entiteId,
      statut: { in: ["A_FAIRE", "EN_COURS"] },
      obligationId: { notIn: Array.from(idsApplicables) },
    },
    select: { id: true },
  });
  if (obsoletes.length > 0) {
    await prisma.dossier.updateMany({
      where: { id: { in: obsoletes.map(d => d.id) } },
      data: { statut: "NON_APPLICABLE" },
    });
  }

  logger.info(`Recalcul dossiers ${entite.raisonSociale} (${anneeFiscale}) : ${applicables.length} obligations applicables, ${crees} dossiers traites, ${obsoletes.length} marques NON_APPLICABLE`);

  return {
    entiteId,
    anneeFiscale,
    obligationsApplicables: applicables.length,
    dossiersTraites: crees,
    dossiersDevenusNonApplicables: obsoletes.length,
  };
}

/**
 * Recalcule pour toutes les entites actives d'une organisation. Utile apres
 * une mise a jour du catalogue d'obligations.
 */
export async function recalculerDossiersOrg(orgId: string, anneeFiscale = new Date().getFullYear()) {
  const entites = await prisma.entite.findMany({
    where: { organizationId: orgId, actif: true },
    select: { id: true, raisonSociale: true },
  });
  const resultats = [];
  for (const e of entites) {
    try {
      const r = await recalculerDossiers(e.id, anneeFiscale);
      resultats.push({ ...r, raisonSociale: e.raisonSociale });
    } catch (err) {
      logger.error(`Echec recalcul ${e.raisonSociale}`, err as Error);
    }
  }
  return resultats;
}

/**
 * KPIs dashboard : agrege les dossiers d'une organisation pour une periode
 * donnee (defaut = mois en cours).
 */
export async function getDashboardKpis(orgId: string, anneeFiscale = new Date().getFullYear()) {
  const debutMois = new Date(anneeFiscale, new Date().getMonth(), 1);
  const finMois = new Date(anneeFiscale, new Date().getMonth() + 1, 0, 23, 59, 59);

  const [
    totalEntites,
    enRetardCount,
    completionMoisCount,
    completionMoisDeposes,
  ] = await Promise.all([
    prisma.entite.count({ where: { organizationId: orgId, actif: true, isClientSelf: false } }),
    prisma.dossier.count({
      where: {
        entite: { organizationId: orgId, actif: true },
        statut: "EN_RETARD",
      },
    }),
    prisma.dossier.count({
      where: {
        entite: { organizationId: orgId, actif: true },
        dateEcheance: { gte: debutMois, lte: finMois },
        statut: { not: "NON_APPLICABLE" },
      },
    }),
    prisma.dossier.count({
      where: {
        entite: { organizationId: orgId, actif: true },
        dateEcheance: { gte: debutMois, lte: finMois },
        statut: { in: ["DEPOSE", "PAYE"] },
      },
    }),
  ]);

  const completionPct = completionMoisCount > 0
    ? Math.round((completionMoisDeposes / completionMoisCount) * 100)
    : 0;

  return {
    totalClients: totalEntites,
    obligationsEnRetard: enRetardCount,
    obligationsDuMois: completionMoisCount,
    obligationsDeposeesDuMois: completionMoisDeposes,
    completionPct,
  };
}
