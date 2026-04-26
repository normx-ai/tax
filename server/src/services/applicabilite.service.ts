// Bloc 2.1 — Moteur d'applicabilite des obligations fiscales.
//
// Evalue les regles JSON `applicabilite` du catalogue d'obligations contre
// le profil d'une entite fiscale. Genere les periodes a partir de
// `echeanceRule` pour creer les dossiers a venir.

import type { Entite, Obligation, Prisma } from "@prisma/client";

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

// === Types stricts pour le format de regles ===

type ValeurSimple = string | number | boolean;

interface CritereOperateurs {
  min?: number;
  max?: number;
  eq?: ValeurSimple;
  in?: ValeurSimple[];
  not_in?: ValeurSimple[];
}

// Un critere peut etre :
// - une valeur simple (string | number | boolean) -> egalite stricte
// - un tableau de valeurs simples -> appartenance
// - un objet operateurs (min/max/eq/in/not_in)
type Critere = ValeurSimple | ValeurSimple[] | CritereOperateurs;

type ReglesApplicabilite = Record<string, Critere>;

// === Helpers de type-narrowing pour les JSON Prisma ===

function isReglesApplicabilite(v: Prisma.JsonValue): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isOperateurs(c: Critere): c is CritereOperateurs {
  return c !== null && typeof c === "object" && !Array.isArray(c);
}

// === Evaluation des regles ===

function evaluerCritere(value: ValeurSimple | undefined, critere: Critere): boolean {
  // Booleen direct
  if (typeof critere === "boolean") return value === critere;
  // Number / string direct
  if (typeof critere === "number" || typeof critere === "string") return value === critere;

  // Liste de valeurs acceptees
  if (Array.isArray(critere)) {
    if (value === undefined) return false;
    return critere.some(v => v === value);
  }

  // Objet operateurs
  if (isOperateurs(critere)) {
    if (critere.min !== undefined && (typeof value !== "number" || value < critere.min)) return false;
    if (critere.max !== undefined && (typeof value !== "number" || value > critere.max)) return false;
    if (critere.eq !== undefined && value !== critere.eq) return false;
    if (critere.in !== undefined && !critere.in.some(v => v === value)) return false;
    if (critere.not_in !== undefined && critere.not_in.some(v => v === value)) return false;
    return true;
  }

  return false;
}

/**
 * Evalue une regle d'applicabilite contre un profil entite.
 *
 * Regles vides ou {} -> applicable a toutes les entites.
 * Sinon : ET logique de tous les criteres saisis.
 */
export function evaluerApplicabilite(regles: Prisma.JsonValue, profil: EntiteProfil): boolean {
  if (!isReglesApplicabilite(regles)) return true;
  const reglesObj = regles as ReglesApplicabilite;
  const entries = Object.entries(reglesObj);
  if (entries.length === 0) return true;

  for (const [field, critereRaw] of entries) {
    if (critereRaw === null || critereRaw === undefined) continue;
    const critere = critereRaw as Critere;
    const valueRaw = profil[field as keyof EntiteProfil];
    const value: ValeurSimple | undefined =
      typeof valueRaw === "string" || typeof valueRaw === "number" || typeof valueRaw === "boolean"
        ? valueRaw
        : undefined;
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
  return new Date(annee, mois, 0).getDate();
}

function jourEffectif(jour: number | "last", annee: number, mois: number): number {
  return jour === "last" ? dernierJourDuMois(annee, mois) : jour;
}

function isEcheanceRule(v: Prisma.JsonValue): v is Prisma.JsonValue & EcheanceRule {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
  const t = (v as { type?: string }).type;
  return t === "monthly" || t === "yearly" || t === "quarterly" || t === "semestriel" || t === "ponctuelle";
}

/**
 * Genere les periodes (et leurs echeances) pour une regle d'echeance, sur
 * une annee fiscale donnee.
 */
export function genererPeriodes(rule: Prisma.JsonValue, annee: number): PeriodeGeneree[] {
  if (!isEcheanceRule(rule)) return [];
  const r = rule as EcheanceRule;

  switch (r.type) {
    case "monthly":
      return Array.from({ length: 12 }, (_, i) => {
        const mois = i + 1;
        const jour = jourEffectif(r.day, annee, mois);
        return {
          periode: `${annee}-${String(mois).padStart(2, "0")}`,
          dateEcheance: new Date(annee, mois - 1, jour),
        };
      });

    case "quarterly":
      return r.months.map((mois, i) => ({
        periode: `${annee}-Q${i + 1}`,
        dateEcheance: new Date(annee, mois - 1, jourEffectif(r.day, annee, mois)),
      }));

    case "semestriel":
      return r.months.map((mois, i) => ({
        periode: `${annee}-S${i + 1}`,
        dateEcheance: new Date(annee, mois - 1, jourEffectif(r.day, annee, mois)),
      }));

    case "yearly":
      return [{
        periode: `${annee}`,
        dateEcheance: new Date(annee, r.month - 1, jourEffectif(r.day, annee, r.month)),
      }];

    case "ponctuelle":
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
