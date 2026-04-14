/**
 * Service ITS - Impot sur les Traitements et Salaires
 * Article 116 CGI Congo 2026
 */

import {
  type SituationFamiliale,
  type PeriodeRevenu,
  type BaremeItsTranche,
  FISCAL_PARAMS,
  calculateCNSS,
  calculateFraisPro,
  calculateQuotient,
  applyBaremeIts,
  annualizeRevenu,
  isUnderSmig,
  calculateTauxEffectif,
} from "./fiscal-common";

export { type SituationFamiliale, type PeriodeRevenu } from "./fiscal-common";

export interface ItsInput {
  salaireBrut: number | null;
  periode: PeriodeRevenu;
  situationFamiliale: SituationFamiliale;
  nombreEnfants: number | null;
  // Sous-ensemble des enfants a charge qui sont infirmes et majeurs.
  // Art. 116-C al. 2 : chaque enfant infirme majeur compte pour 1 part
  // au lieu de 0,5 part.
  enfantsInfirmesMajeurs?: number | null;
  appliquerChargeFamille: boolean;
  avantagesEnNature?: number | null;
  primes?: number | null;
}

export interface TrancheDetail {
  tranche: string;
  min: number;
  max: number | null;
  taux: number;
  tauxAffiche: string;
  baseImposable: number;
  impot: number;
}

export interface ItsResult {
  revenuBrutMensuel: number;
  revenuBrutAnnuel: number;
  baseCnss: number;
  retenueCnss: number;
  retenueCnssMensuelle: number;
  plafondCnssApplique: boolean;
  baseApresCnss: number;
  fraisProfessionnels: number;
  revenuNetImposable: number;
  nombreParts: number;
  revenuParPart: number;
  chargeFamilleAppliquee: boolean;
  detailTranches: TrancheDetail[];
  itsParPart: number;
  itsAnnuel: number;
  itsMensuel: number;
  minimumApplique: boolean;
  smigApplique: boolean;
  tauxEffectif: number;
  salaireNetAnnuel: number;
  salaireNetMensuel: number;
}

export function calculerNombreParts(
  situation: SituationFamiliale,
  nombreEnfants: number | null,
  appliquerCharge: boolean,
  enfantsInfirmesMajeurs: number | null = null
): number {
  return calculateQuotient(
    situation,
    nombreEnfants,
    appliquerCharge,
    enfantsInfirmesMajeurs
  );
}

export function calculerIts(input: ItsInput): ItsResult {
  // Etape 1: Revenu brut annualise
  const salaireBrut = Math.max(0, input.salaireBrut || 0) + Math.max(0, input.avantagesEnNature || 0) + Math.max(0, input.primes || 0);
  const { annuel: revenuBrutAnnuel, mensuel: revenuBrutMensuel } =
    annualizeRevenu(salaireBrut, input.periode);

  // Etape 2: CNSS (Art. 40)
  const cnssResult = calculateCNSS(revenuBrutMensuel);

  // Etape 3-5: Frais pro et revenu net
  const fraisProResult = calculateFraisPro(revenuBrutAnnuel, cnssResult.retenueAnnuelle);

  // Etape 6: Quotient familial (Art. 116 A / 116 B / 116 C)
  const nombreParts = calculateQuotient(
    input.situationFamiliale,
    input.nombreEnfants,
    input.appliquerChargeFamille,
    input.enfantsInfirmesMajeurs
  );
  const revenuParPart = fraisProResult.revenuNetImposable / nombreParts;

  // Etape 7: Bareme progressif ITS 2026
  const { impotTotal, details } = applyBaremeIts(
    revenuParPart,
    FISCAL_PARAMS.its.baremes as BaremeItsTranche[]
  );

  const detailTranches: TrancheDetail[] = details.map((d, i) => ({
    tranche: d.tranche,
    min: FISCAL_PARAMS.its.baremes[i].min,
    max: FISCAL_PARAMS.its.baremes[i].max,
    taux: d.taux,
    tauxAffiche: d.tauxAffiche,
    baseImposable: d.base,
    impot: d.impot,
  }));

  const itsParPart = impotTotal;

  // Etape 8: ITS total
  let itsAnnuel = itsParPart * nombreParts;

  // Le forfait minimum (1 200 FCFA) est déjà appliqué par le barème (tranche 1)
  // Pas de surcharge liée au SMIG — le barème fait foi (Art. 116-G)
  const smigApplique = isUnderSmig(revenuBrutAnnuel);
  const minimumApplique = false;

  const itsMensuel = itsAnnuel / 12;

  const tauxEffectif = calculateTauxEffectif(itsAnnuel, fraisProResult.revenuNetImposable);

  const salaireNetAnnuel = revenuBrutAnnuel - cnssResult.retenueAnnuelle - itsAnnuel;
  const salaireNetMensuel = salaireNetAnnuel / 12;

  return {
    revenuBrutMensuel,
    revenuBrutAnnuel,
    baseCnss: cnssResult.baseAnnuelle,
    retenueCnss: cnssResult.retenueAnnuelle,
    retenueCnssMensuelle: cnssResult.retenueMensuelle,
    plafondCnssApplique: cnssResult.plafondApplique,
    baseApresCnss: fraisProResult.baseApresCnss,
    fraisProfessionnels: fraisProResult.fraisProfessionnels,
    revenuNetImposable: fraisProResult.revenuNetImposable,
    nombreParts,
    revenuParPart,
    chargeFamilleAppliquee: input.appliquerChargeFamille,
    detailTranches,
    itsParPart,
    itsAnnuel: Math.round(itsAnnuel),
    itsMensuel: Math.round(itsMensuel),
    minimumApplique,
    smigApplique,
    tauxEffectif,
    salaireNetAnnuel,
    salaireNetMensuel,
  };
}