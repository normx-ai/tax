/**
 * Service Patente - Contribution des Patentes
 * Art. 314 CGI Congo 2026 (barème)
 * Art. 369 bis (centimes additionnels 5%)
 * CAMU Art. 3-4 (contribution solidarité 0,5% de la patente liquidée)
 */

export interface PatenteInput {
  chiffreAffaires: number | null;
  isEntrepriseNouvelle: boolean;
  isStandBy: boolean;
  isPetroliere: boolean;
  dernierePatente: number | null;
  nombreEntitesFiscales: number;
}

export interface PatenteTrancheDetail {
  tranche: string;
  base: number;
  taux: number;
  montant: number;
}

export interface PatenteResult {
  chiffreAffaires: number;
  tranches: PatenteTrancheDetail[];
  patenteBrute: number;
  reductionStandBy: number;
  patenteApresReduction: number;
  // Réduction 50% uniquement pour les sociétés pétrolières (Art. 314)
  isPetroliere: boolean;
  reductionPetroliere: number;
  // Exonération entreprise nouvelle (Art. 278 al. 4)
  isEntrepriseNouvelle: boolean;
  patenteNette: number;
  // Centimes additionnels (Art. 369 bis)
  centimesAdditionnels: number;
  partChambresCommerce: number;
  partCollectivitesLocales: number;
  // CAMU (Art. 3-4 CAMU : 0,5% de la patente liquidée)
  camu: number;
  // Total
  totalAPayer: number;
  totalParEntite: number;
  nombreEntites: number;
  dateEcheance: string;
  references: string[];
}

// Tranches progressives Art. 314 (à partir de 1 M FCFA)
// La 1ère tranche (< 1 M) = forfait 10.000 FCFA, traitée séparément
const FORFAIT_PREMIERE_TRANCHE = 10_000;

const BAREME_PATENTE = [
  { min: 1_000_000, max: 20_000_000, taux: 0.0075 },
  { min: 20_000_000, max: 40_000_000, taux: 0.0065 },
  { min: 40_000_000, max: 100_000_000, taux: 0.0045 },
  { min: 100_000_000, max: 300_000_000, taux: 0.002 },
  { min: 300_000_000, max: 500_000_000, taux: 0.0015 },
  { min: 500_000_000, max: 1_000_000_000, taux: 0.0014 },
  { min: 1_000_000_000, max: 3_000_000_000, taux: 0.00135 },
  { min: 3_000_000_000, max: 20_000_000_000, taux: 0.00125 },
  { min: 20_000_000_000, max: Infinity, taux: 0.00045 },
];

const TAUX_CENTIMES = 0.05; // 5% (Art. 369 bis)
const PART_CHAMBRES_COMMERCE = 0.20; // 20%
const PART_COLLECTIVITES = 0.80; // 80%
const TAUX_CAMU = 0.005; // 0,5% (Art. 4 CAMU)

function formatTranche(min: number, max: number): string {
  if (max === Infinity) {
    return `> ${formatShort(min)}`;
  }
  return `${formatShort(min)} - ${formatShort(max)}`;
}

function formatShort(montant: number): string {
  if (montant >= 1_000_000_000) {
    return `${(montant / 1_000_000_000).toFixed(0)} Mds`;
  }
  if (montant >= 1_000_000) {
    return `${(montant / 1_000_000).toFixed(0)} M`;
  }
  return montant.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ");
}

function arrondir(montant: number): number {
  return Math.round(montant / 10) * 10;
}

export function calculerPatente(input: PatenteInput): PatenteResult | null {
  const ca = Math.max(0, input.chiffreAffaires || 0);

  if (ca <= 0 && !input.isStandBy && !input.isEntrepriseNouvelle) {
    return null;
  }

  // Exonération entreprise nouvelle (Art. 278 al. 4) — 3 premières années
  // Mais CAMU due même si exonéré (Art. 3 CAMU)
  if (input.isEntrepriseNouvelle) {
    // Calculer la patente "théorique" pour la CAMU
    let patenteTheorique = FORFAIT_PREMIERE_TRANCHE;
    if (ca >= 1_000_000) {
      let restant = ca - 1_000_000;
      for (const b of BAREME_PATENTE) {
        if (restant <= 0) break;
        const largeur = b.max === Infinity ? restant : (b.max - b.min);
        const base = Math.min(restant, largeur);
        patenteTheorique += base * b.taux;
        restant -= base;
      }
    }
    const camuExoneree = arrondir(patenteTheorique * TAUX_CAMU);

    return {
      chiffreAffaires: ca,

      tranches: [],
      patenteBrute: 0,
      reductionStandBy: 0,
      patenteApresReduction: 0,
      isPetroliere: input.isPetroliere,
      reductionPetroliere: 0,
      isEntrepriseNouvelle: true,
      patenteNette: 0,
      centimesAdditionnels: 0,
      partChambresCommerce: 0,
      partCollectivitesLocales: 0,
      camu: camuExoneree,
      totalAPayer: camuExoneree,
      totalParEntite: camuExoneree,
      nombreEntites: 1,
      dateEcheance: "10-20 avril",
      references: [
        "Art. 278 al. 4 : Exonération entreprise nouvelle (3 ans)",
        "Art. 3-4 CAMU : Contribution 0,5% due même si exonéré de patente",
      ],
    };
  }

  // Cas stand-by (Art. 278 al. 6)
  if (input.isStandBy && input.dernierePatente) {
    const montantStandBy = input.dernierePatente * 0.25;
    const patenteApresStandBy = montantStandBy;

    // Réduction 50% uniquement si pétrolière
    const reductionPetroliere = input.isPetroliere ? patenteApresStandBy * 0.5 : 0;
    const patenteNette = arrondir(patenteApresStandBy - reductionPetroliere);

    // Centimes additionnels
    const centimes = arrondir(patenteNette * TAUX_CENTIMES);
    // CAMU 0,5% de la patente liquidée
    const camuStandBy = arrondir(patenteNette * TAUX_CAMU);
    const totalAPayer = patenteNette + centimes + camuStandBy;

    return {
      chiffreAffaires: 0,

      tranches: [],
      patenteBrute: input.dernierePatente,
      reductionStandBy: input.dernierePatente - montantStandBy,
      patenteApresReduction: patenteApresStandBy,
      isPetroliere: input.isPetroliere,
      reductionPetroliere,
      isEntrepriseNouvelle: false,
      patenteNette,
      centimesAdditionnels: centimes,
      partChambresCommerce: arrondir(centimes * PART_CHAMBRES_COMMERCE),
      partCollectivitesLocales: arrondir(centimes * PART_COLLECTIVITES),
      camu: camuStandBy,
      totalAPayer,
      totalParEntite: totalAPayer,
      nombreEntites: 1,
      dateEcheance: "10-20 avril",
      references: [
        "Art. 278 al. 6 : Stand-by = 25% dernière patente",
        ...(input.isPetroliere ? ["Art. 314 : Réduction 50% sociétés pétrolières"] : []),
        "Art. 369 bis : Centimes additionnels 5%",
        "Art. 3-4 CAMU : Contribution solidarité 0,5%",
      ],
    };
  }

  const tranches: PatenteTrancheDetail[] = [];
  let patenteBrute = 0;
  let caRestant = ca;

  // 1ère tranche : forfait 10.000 FCFA (Art. 314)
  patenteBrute = FORFAIT_PREMIERE_TRANCHE;
  tranches.push({
    tranche: ca < 1_000_000 ? `< 1 M` : `0 - 1 M`,
    base: Math.min(ca, 1_000_000),
    taux: 0,
    montant: FORFAIT_PREMIERE_TRANCHE,
  });

  // Tranches suivantes (à partir de 1 M)
  if (ca >= 1_000_000) {
    caRestant = ca - 1_000_000;

    for (const bareme of BAREME_PATENTE) {
      if (caRestant <= 0) break;

      const largeurTranche = bareme.max === Infinity ? caRestant : (bareme.max - bareme.min);
      const baseImposable = Math.min(caRestant, largeurTranche);
      const montantTranche = baseImposable * bareme.taux;

      if (montantTranche > 0) {
        tranches.push({
          tranche: formatTranche(bareme.min, bareme.max),
          base: baseImposable,
          taux: bareme.taux * 100,
          montant: montantTranche,
        });
      }

      patenteBrute += montantTranche;
      caRestant -= baseImposable;
    }
  }

  // Réduction 50% uniquement pour les sociétés pétrolières (Art. 314)
  const reductionPetroliere = input.isPetroliere ? patenteBrute * 0.5 : 0;
  const patenteNette = arrondir(patenteBrute - reductionPetroliere);

  // Centimes additionnels 5% (Art. 369 bis)
  const centimes = arrondir(patenteNette * TAUX_CENTIMES);
  const partCC = arrondir(centimes * PART_CHAMBRES_COMMERCE);
  const partCL = arrondir(centimes * PART_COLLECTIVITES);

  // CAMU 0,5% de la patente liquidée (Art. 3-4 CAMU)
  const camu = arrondir(patenteNette * TAUX_CAMU);

  const totalAPayer = patenteNette + centimes + camu;

  const nombreEntites = Math.max(1, input.nombreEntitesFiscales || 1);
  const totalParEntite = arrondir(totalAPayer / nombreEntites);

  return {
    chiffreAffaires: ca,
    tranches,
    patenteBrute,
    reductionStandBy: 0,
    patenteApresReduction: patenteBrute,
    isPetroliere: input.isPetroliere,
    reductionPetroliere,
    isEntrepriseNouvelle: false,
    patenteNette,
    centimesAdditionnels: centimes,
    partChambresCommerce: partCC,
    partCollectivitesLocales: partCL,
    camu,
    totalAPayer,
    totalParEntite,
    nombreEntites,
    dateEcheance: totalAPayer > 100_000 ? "2 fractions (Q2)" : "10-20 avril",
    references: [
      "Art. 277 : Droit de patente",
      "Art. 278 : Assiette de la patente",
      "Art. 314 : Tarifs (L.F.2023)",
      ...(input.isPetroliere ? ["Art. 314 : Réduction 50% sociétés pétrolières"] : []),
      "Art. 369 bis : Centimes additionnels 5%",
      "Art. 3-4 CAMU : Contribution solidarité 0,5%",
    ],
  };
}
