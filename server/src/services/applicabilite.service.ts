// Bloc 2.1 — Moteur d'applicabilite des obligations fiscales.
//
// Evalue les regles JSON `applicabilite` du catalogue d'obligations contre
// le profil d'une entite fiscale. Genere les periodes a partir de
// `echeanceRule` pour creer les dossiers a venir.

import type { Entite, Obligation } from "@prisma/client";

// === Profil entite normalise (cles utilisees dans les regles) ===

export interface EntiteProfil {
  est_employeur: boolean;
  salaries_count: number;
  possede_foncier_bati: boolean;
  possede_foncier_non_bati: boolean;
  regime_tva: string;          // reel | franchise | exonere | non_assujetti
  regime_is: string;           // reel_normal | reel_simplifie | micro | exonere
  forme_juridique: string;
  secteur_activite: string;
  ca_n_moins_1: number;
  ca_n: number;
  is_client_self: boolean;
}

export function entiteToProfil(e: Entite): EntiteProfil {
  return {
    est_employeur: e.estEmployeur,
    salaries_count: e.effectifSalaries,
    possede_foncier_bati: e.possedeFoncierBati,
    possede_foncier_non_bati: e.possedeFoncierNonBati,
    regime_tva: e.regimeTva.toLowerCase(),
    regime_is: e.regimeIs.toLowerCase(),
    forme_juridique: e.formeJuridique,
    secteur_activite: e.secteurActivite,
    ca_n_moins_1: e.caRealiseAnneeN1 ? Number(e.caRealiseAnneeN1) : 0,
    ca_n: e.caEstimeAnneeCourante ? Number(e.caEstimeAnneeCourante) : 0,
    is_client_self: e.isClientSelf,
  };
}

// === Evaluation des regles ===

interface CritereObjet {
  min?: number;
  max?: number;
  eq?: unknown;
  in?: unknown[];
  not_in?: unknown[];
}

function evaluerCritere(value: unknown, critere: unknown): boolean {
  // Booleen direct
  if (typeof critere === "boolean") return value === critere;

  // Liste de valeurs acceptees
  if (Array.isArray(critere)) {
    if (typeof value === "string") return critere.map(String).includes(value);
    return critere.includes(value);
  }

  // Objet avec operateurs
  if (critere !== null && typeof critere === "object") {
    const c = critere as CritereObjet;
    if (c.min !== undefined && (typeof value !== "number" || value < c.min)) return false;
    if (c.max !== undefined && (typeof value !== "number" || value > c.max)) return false;
    if (c.eq !== undefined && value !== c.eq) return false;
    if (c.in !== undefined && !c.in.map(String).includes(String(value))) return false;
    if (c.not_in !== undefined && c.not_in.map(String).includes(String(value))) return false;
    return true;
  }

  // Valeur litterale
  return value === critere;
}

/**
 * Evalue une regle d'applicabilite contre un profil entite.
 *
 * Regles vides ou {} -> applicable a toutes les entites.
 * Sinon : ET logique de tous les criteres saisis.
 */
export function evaluerApplicabilite(regles: unknown, profil: EntiteProfil): boolean {
  if (regles === null || regles === undefined) return true;
  if (typeof regles !== "object") return true;
  const entries = Object.entries(regles as Record<string, unknown>);
  if (entries.length === 0) return true;

  const profilRecord = profil as unknown as Record<string, unknown>;
  for (const [field, critere] of entries) {
    const value = profilRecord[field];
    if (!evaluerCritere(value, critere)) return false;
  }
  return true;
}

// === Generation des periodes a partir de echeanceRule ===

interface EcheanceMonthly { type: "monthly"; day: number | "last" }
interface EcheanceYearly { type: "yearly"; month: number; day: number | "last" }
interface EcheanceQuarterly { type: "quarterly"; months: number[]; day: number | "last" }
interface EcheanceSemestriel { type: "semestriel"; months: number[]; day: number | "last" }
interface EcheancePonctuelle { type: "ponctuelle"; description?: string }
type EcheanceRule = EcheanceMonthly | EcheanceYearly | EcheanceQuarterly | EcheanceSemestriel | EcheancePonctuelle;

export interface PeriodeGeneree {
  periode: string;
  dateEcheance: Date;
}

function dernierJourDuMois(annee: number, mois: number): number {
  // mois 1-12
  return new Date(annee, mois, 0).getDate();
}

function jourEffectif(jour: number | "last", annee: number, mois: number): number {
  return jour === "last" ? dernierJourDuMois(annee, mois) : jour;
}

/**
 * Genere les periodes (et leurs echeances) pour une regle d'echeance, sur
 * une annee fiscale donnee. Pour les obligations mensuelles, on prend les
 * 12 mois de l'annee. Pour les annuelles, une seule occurrence.
 */
export function genererPeriodes(rule: EcheanceRule, annee: number): PeriodeGeneree[] {
  switch (rule.type) {
    case "monthly":
      return Array.from({ length: 12 }, (_, i) => {
        const mois = i + 1;
        const jour = jourEffectif(rule.day, annee, mois);
        return {
          periode: `${annee}-${String(mois).padStart(2, "0")}`,
          dateEcheance: new Date(annee, mois - 1, jour),
        };
      });

    case "quarterly":
      return rule.months.map((mois, i) => {
        const jour = jourEffectif(rule.day, annee, mois);
        return {
          periode: `${annee}-Q${i + 1}`,
          dateEcheance: new Date(annee, mois - 1, jour),
        };
      });

    case "semestriel":
      return rule.months.map((mois, i) => {
        const jour = jourEffectif(rule.day, annee, mois);
        return {
          periode: `${annee}-S${i + 1}`,
          dateEcheance: new Date(annee, mois - 1, jour),
        };
      });

    case "yearly":
      return [{
        periode: `${annee}`,
        dateEcheance: new Date(annee, rule.month - 1, jourEffectif(rule.day, annee, rule.month)),
      }];

    case "ponctuelle":
      // Pas de periode a precalculer, ces dossiers sont crees manuellement
      return [];

    default:
      return [];
  }
}

/**
 * Filtre la liste d'obligations selon le profil entite.
 */
export function filtrerObligationsApplicables(obligations: Obligation[], profil: EntiteProfil): Obligation[] {
  return obligations.filter(o => evaluerApplicabilite(o.applicabilite, profil));
}
