export type PlanName = 'FREE' | 'STARTER' | 'PRO';

export interface PlanQuota {
  creditsPerMonth: number;      // credits mensuels (-1 = illimite, 0 = pas de mensuel)
  creditsTotal: number;          // credits totaux pour FREE (10)
  trialDays: number;             // duree essai en jours (7 pour FREE)
  simulators: 'basic' | 'all';   // 3 de base ou 16 complets
  fullCodeAccess: boolean;       // acces complet CGI+Social
  fiscalCalendar: boolean;       // calendrier fiscal
  support: 'none' | 'email' | 'priority';
  pricePerYear: number;          // en euros
}

// 1 credit = 1 question IA ou 1 recherche RAG
// 1 audit document = 3 credits
export const CREDITS_PER_AUDIT = 3;

export const PLAN_QUOTAS: Record<PlanName, PlanQuota> = {
  FREE: {
    creditsPerMonth: 0,
    creditsTotal: 10,
    trialDays: 7,
    simulators: 'basic',
    fullCodeAccess: false,
    fiscalCalendar: false,
    support: 'none',
    pricePerYear: 0,
  },
  STARTER: {
    creditsPerMonth: 80,
    creditsTotal: 0,
    trialDays: 0,
    simulators: 'all',
    fullCodeAccess: true,
    fiscalCalendar: true,
    support: 'email',
    pricePerYear: 150,
  },
  PRO: {
    creditsPerMonth: 150,
    creditsTotal: 0,
    trialDays: 0,
    simulators: 'all',
    fullCodeAccess: true,
    fiscalCalendar: true,
    support: 'priority',
    pricePerYear: 300,
  },
};

// Packs credits a la carte (ne se resetent pas, valides jusqu'a utilisation)
export interface CreditPack {
  id: string;
  credits: number;
  priceEur: number;
  label: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack_30', credits: 30, priceEur: 15, label: '30 credits' },
  { id: 'pack_80', credits: 80, priceEur: 25, label: '80 credits' },
  { id: 'pack_150', credits: 150, priceEur: 35, label: '150 credits' },
];

const PLAN_ORDER: PlanName[] = ['FREE', 'STARTER', 'PRO'];

export function getPlanQuota(plan: PlanName): PlanQuota {
  return PLAN_QUOTAS[plan] || PLAN_QUOTAS.FREE;
}

export function isPlanAtLeast(current: PlanName, minimum: PlanName): boolean {
  return PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(minimum);
}

export function getPlanOrder(plan: PlanName): number {
  return PLAN_ORDER.indexOf(plan);
}

export function isPaidPlan(plan: PlanName): boolean {
  return plan !== 'FREE';
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function getPlanDisplayName(plan: PlanName): string {
  const names: Record<PlanName, string> = {
    FREE: 'Découverte',
    STARTER: 'Starter',
    PRO: 'Pro',
  };
  return names[plan];
}

export function getPlanPriceFCFA(plan: PlanName): number {
  const EUR_TO_FCFA = 656;
  return Math.round(PLAN_QUOTAS[plan].pricePerYear * EUR_TO_FCFA / 1000) * 1000;
}

/** Simulateurs de base (FREE) */
export const BASIC_SIMULATORS = ['its', 'tva', 'is'];

/** Tous les simulateurs (STARTER+) */
export const ALL_SIMULATORS = [
  'its', 'tva', 'is', 'paie', 'patente',
  'solde-liquidation', 'retenue-source', 'is-parapetrolier',
  'iba', 'ircm', 'irf-loyers', 'taxe-immobiliere',
  'enregistrement', 'cession-parts', 'contribution-fonciere', 'igf',
];
