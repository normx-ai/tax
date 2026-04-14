/**
 * Service Paie — Simulateur de bulletin de paie
 * CGI Congo-Brazzaville 2026
 * Art. 114-A (exonérations), Art. 115 (avantages en nature), Art. 116 (barème ITS)
 */

import {
  type SituationFamiliale,
  type BaremeItsTranche,
  FISCAL_PARAMS,
  PAIE_PARAMS,
  calculateCNSS,
  calculateFraisPro,
  calculateQuotient,
  applyBaremeIts,
  calculateTauxEffectif,
} from "./fiscal-common";

export { type SituationFamiliale } from "./fiscal-common";

export type ProfilSalarie = "national" | "etranger_resident" | "non_resident";
export type ZoneTOL = "centre_ville" | "peripherie";

export interface RubriquesInput {
  // Rémunération de base
  salaireBase: number;
  primesImposables: number;
  heuresSup: number;
  congesAnnuels: number;
  // Indemnités et primes
  primeTransport: number;      // exonérée ITS (Art. 114-A b)
  primeRepresentation: number; // exonérée ITS (Art. 114-A a)
  primePanier: number;         // exonérée ITS (Art. 114-A)
  primeSalissure: number;      // exonérée ITS (Art. 114-A)
  // Avantages en nature (Art. 115) — valeur réelle ou forfaitaire
  avLogement: number;
  avDomesticite: number;
  avElectricite: number;
  avVoiture: number;
  avTelephone: number;
  avNourriture: number;
}

export interface PaieInput {
  rubriques: RubriquesInput;
  profilSalarie: ProfilSalarie;
  situationFamiliale: SituationFamiliale;
  nombreEnfants: number;
  // Sous-ensemble des enfants a charge qui sont infirmes et majeurs
  // (Art. 116-C al. 2 : 1 part au lieu de 0,5 part par enfant).
  enfantsInfirmesMajeurs?: number;
  zoneTOL: ZoneTOL;
  moisJanvier: boolean;
}

export interface PaieResult {
  // Bases
  salaireBrutTotal: number;
  baseCNSS: number;
  baseITS: number;
  baseTUS: number;
  totalExonere: number;
  totalAvantagesNature: number;

  // CNSS salarié
  cnssSalarieMensuel: number;
  cnssPlafondApplique: boolean;

  // ITS
  modeCalculIts: "bareme" | "forfaitaire_20";
  nombreParts: number;
  revenuNetImposable: number;
  itsAnnuel: number;
  itsMensuel: number;

  // TUS, TOL, CAMU, Taxe régionale
  tauxTUS: number;
  tusMensuel: number;
  tolMensuel: number;
  baseCAMU: number;
  camuMensuel: number;
  taxeRegionale: number;

  // Totaux salarié
  totalRetenuesSalarie: number;
  salaireNetMensuel: number;
  salaireNetAnnuel: number;

  // Charges patronales
  cnssVieillessePatronale: number;
  cnssAFPatronale: number;
  cnssPFPatronale: number;
  totalChargesPatronales: number;
  coutTotalEmployeur: number;

  tauxEffectif: number;
}

/**
 * Calcule les montants forfaitaires des avantages en nature (Art. 115 CGI)
 * Si la valeur réelle n'est pas saisie, ces taux s'appliquent.
 */
export function calculerAvantagesForfaitaires(salairePresence: number): Partial<RubriquesInput> {
  const plafondCNSS = FISCAL_PARAMS.cnss.plafondMensuel;
  const taux = PAIE_PARAMS.avantagesNatureForfait;
  return {
    avLogement: Math.round(Math.min(salairePresence, plafondCNSS) * taux.logement),
    avDomesticite: Math.round(salairePresence * taux.domesticite),
    avElectricite: Math.round(salairePresence * taux.electricite),
    avVoiture: Math.round(salairePresence * taux.voiture),
    avTelephone: Math.round(salairePresence * taux.telephone),
    avNourriture: Math.round(salairePresence * taux.nourriture),
  };
}

/**
 * Calcule l'intégralité du bulletin de paie
 */
export function calculerPaie(input: PaieInput): PaieResult {
  const r: RubriquesInput = {} as RubriquesInput;
  for (const key of Object.keys(input.rubriques) as (keyof RubriquesInput)[]) {
    r[key] = Math.max(0, input.rubriques[key] || 0);
  }

  // --- Étape 1 : Calcul des bases ---
  const salairePresence = r.salaireBase + r.primesImposables + r.heuresSup + r.congesAnnuels;

  // Base CNSS : salaire de présence uniquement (hors avantages en nature, hors panier/salissure)
  const baseCNSS = salairePresence;

  // Total avantages en nature
  const totalAvantagesNature =
    r.avLogement + r.avDomesticite + r.avElectricite +
    r.avVoiture + r.avTelephone + r.avNourriture;

  // Éléments exonérés (Art. 114-A)
  const totalExonere = r.primeTransport + r.primeRepresentation + r.primePanier + r.primeSalissure;

  // Salaire brut total = salaire de base + primes imposables + heures sup + congés + avantages en nature
  const salaireBrutTotal = salairePresence + totalAvantagesNature;

  // Base TUS = brut total
  const baseTUS = salaireBrutTotal;

  // --- Étape 2 : CNSS salarié (4%) ---
  const cnssResult = calculateCNSS(baseCNSS);
  const cnssSalarieMensuel = Math.round(cnssResult.retenueMensuelle);

  // Base ITS = (brut total − CNSS) × (1 − fraisPro) — HIGH-08
  const baseITS = Math.round((salaireBrutTotal - cnssSalarieMensuel) * (1 - FISCAL_PARAMS.fraisPro.taux));

  // --- Étape 3 : ITS (même logique que simulateur ITS) ---
  const isResident = input.profilSalarie !== "non_resident";
  let modeCalculIts: "bareme" | "forfaitaire_20";
  let nombreParts: number;
  let revenuNetImposable: number;
  let itsAnnuel: number;

  // Base ITS annuelle (baseITS = (brut − CNSS) × 80% mensuel)
  revenuNetImposable = baseITS * 12;

  if (isResident) {
    // Résidents : barème progressif Art. 116
    modeCalculIts = "bareme";

    // Quotient familial
    nombreParts = calculateQuotient(input.situationFamiliale, input.nombreEnfants, true, input.enfantsInfirmesMajeurs ?? null);
    const revenuParPart = revenuNetImposable / nombreParts;

    // Barème ITS
    const { impotTotal } = applyBaremeIts(
      revenuParPart,
      FISCAL_PARAMS.its.baremes as BaremeItsTranche[]
    );
    itsAnnuel = Math.round(impotTotal * nombreParts);
  } else {
    // Non-résidents : 20% forfaitaire
    modeCalculIts = "forfaitaire_20";
    nombreParts = 1;
    itsAnnuel = Math.round(revenuNetImposable * PAIE_PARAMS.nonResident.tauxForfaitaire);
  }

  const itsMensuel = Math.round(itsAnnuel / 12);

  // --- Étape 4 : TUS ---
  const tauxTUS = isResident ? PAIE_PARAMS.tus.tauxResident : PAIE_PARAMS.tus.tauxNonResident;
  const tusMensuel = Math.round(baseTUS * tauxTUS);

  // --- Étape 5 : TOL ---
  const tolMensuel = input.zoneTOL === "centre_ville"
    ? PAIE_PARAMS.tol.centreVille
    : PAIE_PARAMS.tol.peripherie;

  // --- Étape 6 : CAMU (Art. 3-4) — 0,5% de la fraction du revenu > 500 000 ---
  const brutTaxable = salaireBrutTotal - cnssSalarieMensuel;
  const baseCAMU = Math.max(0, brutTaxable - PAIE_PARAMS.camu.seuilMensuel);
  const camuMensuel = Math.round(baseCAMU * PAIE_PARAMS.camu.taux);

  // --- Étape 7 : Taxe régionale ---
  // Taxe régionale : 2 400 FCFA/an, prélevée une seule fois en janvier
  const taxeRegionale = input.moisJanvier ? PAIE_PARAMS.taxeRegionale : 0;

  // --- Étape 8-9 : Total retenues et salaire net (TUS = charge employeur, pas retenue salarié) ---
  const totalRetenuesSalarie =
    cnssSalarieMensuel + itsMensuel + tolMensuel + camuMensuel + taxeRegionale;

  // Net à payer = brut total + primes non imposables − avantages en nature − retenues
  const salaireNetMensuel = salaireBrutTotal + totalExonere - totalAvantagesNature - totalRetenuesSalarie;
  const salaireNetAnnuel = salaireNetMensuel * 12;

  // --- Étape 10 : Charges patronales CNSS ---
  const { cnssPatronale } = PAIE_PARAMS;
  const cnssVieillessePatronale = Math.round(
    Math.min(baseCNSS, cnssPatronale.vieillesse.plafondMensuel) * cnssPatronale.vieillesse.taux
  );
  const cnssAFPatronale = Math.round(
    Math.min(baseCNSS, cnssPatronale.allocationsFamiliales.plafondMensuel) * cnssPatronale.allocationsFamiliales.taux
  );
  const cnssPFPatronale = Math.round(
    Math.min(baseCNSS, cnssPatronale.prestationsFamiliales.plafondMensuel) * cnssPatronale.prestationsFamiliales.taux
  );
  const totalChargesPatronales = cnssVieillessePatronale + cnssAFPatronale + cnssPFPatronale + tusMensuel;

  // --- Étape 11 : Coût total employeur ---
  const coutTotalEmployeur = salaireBrutTotal + totalChargesPatronales;

  // Taux effectif
  const tauxEffectif = calculateTauxEffectif(totalRetenuesSalarie, salaireBrutTotal);

  return {
    salaireBrutTotal,
    baseCNSS,
    baseITS,
    baseTUS,
    totalExonere,
    totalAvantagesNature,
    cnssSalarieMensuel,
    cnssPlafondApplique: cnssResult.plafondApplique,
    modeCalculIts,
    nombreParts,
    revenuNetImposable,
    itsAnnuel,
    itsMensuel,
    tauxTUS,
    tusMensuel,
    tolMensuel,
    baseCAMU,
    camuMensuel,
    taxeRegionale,
    totalRetenuesSalarie,
    salaireNetMensuel,
    salaireNetAnnuel,
    cnssVieillessePatronale,
    cnssAFPatronale,
    cnssPFPatronale,
    totalChargesPatronales,
    coutTotalEmployeur,
    tauxEffectif,
  };
}
