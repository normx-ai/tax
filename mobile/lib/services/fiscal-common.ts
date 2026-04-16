/**
 * Service commun pour les calculs fiscaux
 * Centralise les methodes et constantes partagees entre IBA, ITS et IS
 * CGI Congo-Brazzaville 2026
 */

export type SituationFamiliale = "celibataire" | "marie" | "divorce" | "veuf";
export type PeriodeRevenu = "mensuel" | "annuel";

export interface CnssResult {
  baseMensuelle: number;
  baseAnnuelle: number;
  retenueMensuelle: number;
  retenueAnnuelle: number;
  plafondApplique: boolean;
}

export interface FraisProResult {
  baseApresCnss: number;
  fraisProfessionnels: number;
  revenuNetImposable: number;
}

export interface BaremeTranche {
  min: number;
  max: number | null;
  taux: number;
}

export interface BaremeItsTranche extends BaremeTranche {
  forfait?: number;
}

// Configuration fiscale 2026
export const FISCAL_PARAMS = {
  cnss: {
    taux: 0.04,
    plafondMensuel: 1_200_000,
  },
  fraisPro: {
    taux: 0.20,
  },
  quotientFamilial: {
    maxParts: 6.5,
  },
  smig: {
    mensuel: 70_400,
    annuel: 70_400 * 12,
  },
  its: {
    baremes: [
      { min: 0, max: 615_000, taux: 0, forfait: 1_200 },
      { min: 615_000, max: 1_500_000, taux: 0.10 },
      { min: 1_500_000, max: 3_500_000, taux: 0.15 },
      { min: 3_500_000, max: 5_000_000, taux: 0.20 },
      { min: 5_000_000, max: null, taux: 0.30 },
    ] as BaremeItsTranche[],
    minimumAnnuel: 1_200,
  },
  is: {
    tauxGeneral: 0.28,
    tauxMinimum: 0.01, // Art. 86-C §3 : fixé à 1%
  },
};

// Paramètres spécifiques au simulateur de Paie — CGI Congo 2026
export const PAIE_PARAMS = {
  tus: { tauxResident: 0.075, tauxNonResident: 0.06 },
  tol: { centreVille: 5_000, peripherie: 1_000 },
  camu: { taux: 0.005, seuilMensuel: 500_000 },
  taxeRegionale: 2_400,
  nonResident: { tauxForfaitaire: 0.20 },
  cnssPatronale: {
    vieillesse: { taux: 0.08, plafondMensuel: 1_200_000 },
    allocationsFamiliales: { taux: 0.1003, plafondMensuel: 600_000 },
    prestationsFamiliales: { taux: 0.0225, plafondMensuel: 600_000 },
  },
  avantagesNatureForfait: {
    logement: 0.20,      // base = plafond CNSS (1 200 000)
    domesticite: 0.07,   // base = salaire brut de présence
    electricite: 0.05,   // base = salaire brut de présence
    telephone: 0.02,     // base = salaire brut de présence
    voiture: 0.03,       // base = salaire brut de présence
    nourriture: 0.20,    // base = salaire brut de présence
  },
};

export function calculateCNSS(revenuBrutMensuel: number): CnssResult {
  const { taux, plafondMensuel } = FISCAL_PARAMS.cnss;
  const baseMensuelle = Math.min(revenuBrutMensuel, plafondMensuel);
  const retenueMensuelle = baseMensuelle * taux;
  const plafondApplique = revenuBrutMensuel > plafondMensuel;

  return {
    baseMensuelle,
    baseAnnuelle: baseMensuelle * 12,
    retenueMensuelle,
    retenueAnnuelle: retenueMensuelle * 12,
    plafondApplique,
  };
}

export function calculateFraisPro(revenuBrutAnnuel: number, retenueCnssAnnuelle: number): FraisProResult {
  const baseApresCnss = revenuBrutAnnuel - retenueCnssAnnuelle;
  const fraisProfessionnels = baseApresCnss * FISCAL_PARAMS.fraisPro.taux;
  const revenuNetImposable = baseApresCnss - fraisProfessionnels;

  return { baseApresCnss, fraisProfessionnels, revenuNetImposable };
}

export function calculateQuotient(
  situation: SituationFamiliale,
  nombreEnfants: number | null,
  appliquerCharge = true,
  enfantsInfirmesMajeurs: number | null = null
): number {
  if (!appliquerCharge) return 1;

  const enfants = Math.max(0, nombreEnfants || 0);
  const infirmesMajeurs = Math.max(
    0,
    Math.min(enfantsInfirmesMajeurs || 0, enfants)
  );

  let partsBase: number;
  if (situation === "marie") {
    partsBase = 2;
  } else if (situation === "veuf" && enfants > 0) {
    partsBase = 2;
  } else {
    partsBase = 1;
  }

  // Art. 116-B CGI : bareme du nombre de parts.
  // - Marie ou veuf avec N enfants : 2 + 0,5 N
  // - Celibataire/divorce avec N enfants (N >= 1) : 2 + 0,5 (N - 1)
  //   (le 1er enfant apporte 1 part entiere, les suivants 0,5 part)
  let partsEnfants: number;
  if (situation === "celibataire" || situation === "divorce") {
    if (enfants === 0) {
      partsEnfants = 0;
    } else {
      partsEnfants = 1 + (enfants - 1) * 0.5;
    }
  } else {
    partsEnfants = enfants * 0.5;
  }

  // Art. 116-C al. 2 CGI : "Le quotient familial est augmente d'une
  // part pour l'enfant infirme majeur au lieu d'une demi-part."
  // Lecture officielle : l'enfant infirme majeur vaut 1 part a la place
  // de 0,5 part (remplacement, pas cumul). L'ecart par rapport a un
  // enfant ordinaire est donc +0,5 part par enfant infirme majeur.
  // Ex : marie 4 enfants dont 1 infirme = 2 + 4 x 0,5 + 0,5 = 4,5 parts.
  const bonusInfirmesMajeurs = infirmesMajeurs * 0.5;

  const totalParts = partsBase + partsEnfants + bonusInfirmesMajeurs;
  return Math.min(totalParts, FISCAL_PARAMS.quotientFamilial.maxParts);
}

export function applyBaremeIts(
  revenuParPart: number,
  baremes: BaremeItsTranche[]
): { impotTotal: number; details: { tranche: string; tauxAffiche: string; taux: number; base: number; impot: number }[] } {
  const details: { tranche: string; tauxAffiche: string; taux: number; base: number; impot: number }[] = [];
  let impotTotal = 0;
  let revenuRestant = revenuParPart;

  for (const tranche of baremes) {
    if (revenuRestant <= 0) break;

    const limiteHaute = tranche.max ?? Infinity;
    const largeurTranche = limiteHaute - tranche.min;
    const baseImposable = Math.min(revenuRestant, largeurTranche);

    let impot: number;
    let tauxAffiche: string;

    if (tranche.forfait !== undefined) {
      impot = tranche.forfait;
      tauxAffiche = `${formatMontant(tranche.forfait)} (forfait)`;
    } else {
      impot = baseImposable * tranche.taux;
      tauxAffiche = `${tranche.taux * 100}%`;
    }

    details.push({
      tranche: tranche.max
        ? `${formatMontant(tranche.min)} - ${formatMontant(tranche.max)}`
        : `> ${formatMontant(tranche.min)}`,
      tauxAffiche,
      taux: tranche.taux * 100,
      base: baseImposable,
      impot,
    });

    impotTotal += impot;
    revenuRestant -= baseImposable;
  }

  return { impotTotal, details };
}

export function applyBareme(
  revenuParPart: number,
  baremes: BaremeTranche[]
): { impotTotal: number; details: { tranche: string; taux: number; base: number; impot: number }[] } {
  const details: { tranche: string; taux: number; base: number; impot: number }[] = [];
  let impotTotal = 0;
  let revenuRestant = revenuParPart;

  for (const tranche of baremes) {
    if (revenuRestant <= 0) break;

    const limiteHaute = tranche.max ?? Infinity;
    const largeurTranche = limiteHaute - tranche.min;
    const baseImposable = Math.min(revenuRestant, largeurTranche);
    const impot = baseImposable * tranche.taux;

    details.push({
      tranche: tranche.max
        ? `${formatMontant(tranche.min)} - ${formatMontant(tranche.max)}`
        : `> ${formatMontant(tranche.min)}`,
      taux: tranche.taux * 100,
      base: baseImposable,
      impot,
    });

    impotTotal += impot;
    revenuRestant -= baseImposable;
  }

  return { impotTotal, details };
}

export function annualizeRevenu(montant: number, periode: PeriodeRevenu): { annuel: number; mensuel: number } {
  const annuel = periode === "mensuel" ? montant * 12 : montant;
  const mensuel = annuel / 12;
  return { annuel, mensuel };
}

export function isUnderSmig(revenuBrutAnnuel: number): boolean {
  return revenuBrutAnnuel < FISCAL_PARAMS.smig.annuel;
}

export function calculateTauxEffectif(impot: number, revenuNetImposable: number): number {
  return revenuNetImposable > 0 ? (impot / revenuNetImposable) * 100 : 0;
}

export function formatMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(montant)).replace(/[\u202F\u00A0]/g, " ") + " FCFA";
}

export function formatNumber(montant: number): string {
  // Intl fr-FR utilise U+202F (narrow no-break space) qui s'affiche "/" dans certaines polices a l'impression
  // On remplace par un espace normal pour un rendu propre partout
  return new Intl.NumberFormat("fr-FR").format(Math.round(montant)).replace(/[\u202F\u00A0]/g, " ");
}

/**
 * Formate une saisie numerique avec separateurs de milliers (espaces).
 * Utilise dans les TextInput pour afficher ex: "1 050 000" pendant la saisie.
 */
const MAX_INPUT_AMOUNT = 100_000_000_000; // 100 milliards FCFA

export function formatInputNumber(text: string): string {
  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  const capped = num > MAX_INPUT_AMOUNT ? String(MAX_INPUT_AMOUNT) : digits;
  return capped.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
