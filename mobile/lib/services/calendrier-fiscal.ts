// Service centralisant les donnees et la logique du calendrier fiscal CGI Congo 2026
// Conforme Art. 461 bis (L.F. 2026) : délais fixés au 15 de chaque mois, sauf août = 20

export interface EcheanceFiscale {
  jour: number;
  moisIndex: number; // 0-11, -1 = tous les mois (recurrent)
  label: string;
  icon: string;
  recurrent: boolean;
  descriptionKey: string;
}

export interface JourCalendrier {
  jour: number | null;
  estAujourdhui: boolean;
  estPasse: boolean;
  echeances: EcheanceFiscale[];
}

// Calendrier fiscal complet CGI Congo 2026
export const ECHEANCES_FISCALES: EcheanceFiscale[] = [
  // ============================================================
  // OBLIGATIONS MENSUELLES (récurrentes — Art. 461 bis : le 15)
  // ============================================================

  // --- Impôts sur les revenus ---
  // ITS mensuel (Art. 116 CGI) — retenu à la source sur salaires
  { jour: 15, moisIndex: -1, label: "ITS mensuel", icon: "people-outline", recurrent: true, descriptionKey: "calendrier.desc.its" },
  // TUS mensuel (Taxe Unique sur Salaires 7,5% / 6% non-résident)
  { jour: 15, moisIndex: -1, label: "TUS mensuel", icon: "people-outline", recurrent: true, descriptionKey: "calendrier.desc.tus" },
  // Retenue à la source (Art. 86-D non-résidents 20%, Art. 183 non soumis IS 10%)
  { jour: 15, moisIndex: -1, label: "Retenue à la source", icon: "arrow-down-outline", recurrent: true, descriptionKey: "calendrier.desc.retenue" },
  // IRCM mensuel (Art. 103-110A) — revenus de capitaux mobiliers
  { jour: 15, moisIndex: -1, label: "IRCM mensuel", icon: "trending-up-outline", recurrent: true, descriptionKey: "calendrier.desc.ircm" },
  // IS forfaitaire parapétrolier (Art. 92-B) — mensualité IS
  { jour: 15, moisIndex: -1, label: "IS forfaitaire (parapétrolier)", icon: "flame-outline", recurrent: true, descriptionKey: "calendrier.desc.isParaMensuel" },
  // IRCM forfaitaire parapétrolier (Art. 9 ter T2L3) — mensualité IRCM
  { jour: 15, moisIndex: -1, label: "IRCM forfaitaire (parapétrolier)", icon: "flame-outline", recurrent: true, descriptionKey: "calendrier.desc.ircmParaMensuel" },

  // --- TVA & taxes indirectes ---
  // TVA mensuelle (Art. 461 bis / TFNC6)
  { jour: 15, moisIndex: -1, label: "TVA mensuelle", icon: "receipt-outline", recurrent: true, descriptionKey: "calendrier.desc.tva" },
  // Centimes additionnels TVA 5% (Art. 38-A TFNC6)
  { jour: 15, moisIndex: -1, label: "Centimes additionnels TVA (5%)", icon: "receipt-outline", recurrent: true, descriptionKey: "calendrier.desc.centimesTva" },
  // Droits d'accises (TFNC6) — tabac, boissons alcoolisées/non alcoolisées
  { jour: 15, moisIndex: -1, label: "Droits d'accises", icon: "wine-outline", recurrent: true, descriptionKey: "calendrier.desc.accises" },

  // --- Cotisations sociales ---
  // CNSS mensuel — cotisations retraite, PF, AT
  { jour: 15, moisIndex: -1, label: "CNSS mensuel", icon: "shield-outline", recurrent: true, descriptionKey: "calendrier.desc.cnss" },
  // CAMU mensuel (0,5% — Art. 3-4 CAMU)
  { jour: 15, moisIndex: -1, label: "CAMU mensuel", icon: "medkit-outline", recurrent: true, descriptionKey: "calendrier.desc.camu" },

  // --- Taxes diverses ---
  // Taxe sur les transferts de fonds (1,5% — Annexe XV CGI)
  { jour: 15, moisIndex: -1, label: "Taxe transferts de fonds", icon: "swap-vertical-outline", recurrent: true, descriptionKey: "calendrier.desc.transfertsFonds" },
  // Taxe sur les contrats d'assurance (Art. 336 T2L1)
  { jour: 15, moisIndex: -1, label: "Taxe contrats d'assurance", icon: "umbrella-outline", recurrent: true, descriptionKey: "calendrier.desc.assurance" },
  // Taxe sur les jeux de hasard (10% — Annexe XIII CGI)
  { jour: 15, moisIndex: -1, label: "Taxe jeux de hasard", icon: "dice-outline", recurrent: true, descriptionKey: "calendrier.desc.jeux" },
  // Redevance audiovisuelle (Annexe XII CGI)
  { jour: 15, moisIndex: -1, label: "Redevance audiovisuelle (RAV)", icon: "tv-outline", recurrent: true, descriptionKey: "calendrier.desc.rav" },
  // Taxe sur le trafic des communications électroniques
  { jour: 15, moisIndex: -1, label: "Taxe communications électroniques", icon: "call-outline", recurrent: true, descriptionKey: "calendrier.desc.telecom" },

  // ============================================================
  // OBLIGATIONS SPÉCIFIQUES PAR MOIS
  // ============================================================

  // ===== JANVIER =====
  // Taxe régionale sur les résidents (Art. 250 bis)
  { jour: 31, moisIndex: 0, label: "Taxe régionale (résidents)", icon: "flag-outline", recurrent: false, descriptionKey: "calendrier.desc.taxeRegionale" },

  // ===== MARS =====
  // IS — Minimum de perception T1 (Art. 86-C §5 : 15 mars)
  { jour: 15, moisIndex: 2, label: "Minimum perception IS (T1)", icon: "business-outline", recurrent: false, descriptionKey: "calendrier.desc.isT1" },
  // Déclaration IBA annuel (Art. 93-102)
  { jour: 15, moisIndex: 2, label: "Déclaration IBA annuel", icon: "person-outline", recurrent: false, descriptionKey: "calendrier.desc.iba" },
  // ===== FÉVRIER =====
  // DAS annuelle — Déclaration Annuelle des Salaires (Art. 176, 179, 180)
  { jour: 15, moisIndex: 1, label: "DAS annuelle (décl. salaires)", icon: "document-text-outline", recurrent: false, descriptionKey: "calendrier.desc.das" },
  // IGF — 1er versement trimestriel (Art. 3bis TFNC4 : 20 mars)
  { jour: 20, moisIndex: 2, label: "IGF (1er versement)", icon: "wallet-outline", recurrent: false, descriptionKey: "calendrier.desc.igf1" },

  // ===== AVRIL =====
  // Patente annuelle (Art. 310 : entre 10-20 avril → 15 avril Art. 461 bis)
  { jour: 15, moisIndex: 3, label: "Patente annuelle", icon: "storefront-outline", recurrent: false, descriptionKey: "calendrier.desc.patente" },
  // Centimes additionnels patente (Art. 369 bis)
  { jour: 15, moisIndex: 3, label: "Centimes additionnels patente (5%)", icon: "storefront-outline", recurrent: false, descriptionKey: "calendrier.desc.centimesPatente" },
  // Contribution foncière (Art. 257 bis, 270)
  // TOL habitation (Art. 14 TFNC4-TOL : exigible au plus tard le 20 avril)
  { jour: 20, moisIndex: 3, label: "TOL habitation", icon: "home-outline", recurrent: false, descriptionKey: "calendrier.desc.tolHabitation" },
  // TOL professionnels (Art. 14 TFNC4-TOL : retenue à la source mensuelle, même échéance que les autres impôts)
  { jour: 15, moisIndex: -1, label: "TOL professionnels (retenue)", icon: "home-outline", recurrent: true, descriptionKey: "calendrier.desc.tolPro" },
  { jour: 30, moisIndex: 3, label: "Contribution foncière (CFPB/CFPNB)", icon: "home-outline", recurrent: false, descriptionKey: "calendrier.desc.cfpb" },
  // Déclaration IS annuelle (Art. 86-F : 4 mois après clôture 31/12 → 30 avril)
  { jour: 30, moisIndex: 3, label: "Déclaration IS annuelle", icon: "business-outline", recurrent: false, descriptionKey: "calendrier.desc.declarationIS" },

  // ===== MAI =====
  // IRF Loyers — 1re échéance (Art. 113A : 15 mai)
  { jour: 15, moisIndex: 4, label: "IRF Loyers (1re échéance)", icon: "home-outline", recurrent: false, descriptionKey: "calendrier.desc.irf1" },
  // Solde de liquidation IS (Art. 86-G : dès remise déclaration → 15 mai)
  { jour: 15, moisIndex: 4, label: "Solde de liquidation IS", icon: "business-outline", recurrent: false, descriptionKey: "calendrier.desc.soldeIS" },
  // Solde IBA annuel (Art. 200 : entre 10-20 mai → 15 mai)
  { jour: 15, moisIndex: 4, label: "Solde IBA annuel", icon: "person-outline", recurrent: false, descriptionKey: "calendrier.desc.soldeIBA" },

  // ===== JUIN =====
  // IS — Minimum de perception T2 (Art. 86-C §5 : 15 juin)
  { jour: 15, moisIndex: 5, label: "Minimum perception IS (T2)", icon: "business-outline", recurrent: false, descriptionKey: "calendrier.desc.isT2" },
  // IGF — 2e versement trimestriel (Art. 3bis TFNC4 : 20 juin)
  { jour: 20, moisIndex: 5, label: "IGF (2e versement)", icon: "wallet-outline", recurrent: false, descriptionKey: "calendrier.desc.igf2" },

  // ===== AOÛT =====
  // IRF Loyers — 2e échéance (Art. 113A : 20 août)
  { jour: 20, moisIndex: 7, label: "IRF Loyers (2e échéance)", icon: "home-outline", recurrent: false, descriptionKey: "calendrier.desc.irf2" },

  // ===== SEPTEMBRE =====
  // IS — Minimum de perception T3 (Art. 86-C §5 : 15 sept)
  { jour: 15, moisIndex: 8, label: "Minimum perception IS (T3)", icon: "business-outline", recurrent: false, descriptionKey: "calendrier.desc.isT3" },
  // IGF — 3e versement trimestriel (Art. 3bis TFNC4 : 20 sept)
  { jour: 20, moisIndex: 8, label: "IGF (3e versement)", icon: "wallet-outline", recurrent: false, descriptionKey: "calendrier.desc.igf3" },

  // ===== NOVEMBRE =====
  // IRF Loyers — 3e échéance (Art. 113A : 15 nov)
  { jour: 15, moisIndex: 10, label: "IRF Loyers (3e échéance)", icon: "home-outline", recurrent: false, descriptionKey: "calendrier.desc.irf3" },

  // ===== DÉCEMBRE =====
  // IS — Minimum de perception T4 (Art. 86-C §5 : 15 déc)
  { jour: 15, moisIndex: 11, label: "Minimum perception IS (T4)", icon: "business-outline", recurrent: false, descriptionKey: "calendrier.desc.isT4" },
  // IGF — 4e versement trimestriel (Art. 3bis TFNC4 : 20 déc)
  { jour: 20, moisIndex: 11, label: "IGF (4e versement)", icon: "wallet-outline", recurrent: false, descriptionKey: "calendrier.desc.igf4" },
];

/**
 * Retourne les echeances d'un mois donne (0-11), y compris les recurrentes.
 * Art. 461 bis (L.F. 2026) : en août, les obligations récurrentes passent au 20.
 */
export function getEcheancesDuMois(mois: number): EcheanceFiscale[] {
  return ECHEANCES_FISCALES.filter(
    (e) => e.moisIndex === mois || (e.recurrent && e.moisIndex === -1)
  ).map((e) => {
    // Art. 461 bis (L.F. 2026) : en août, le délai passe au 20 du mois
    if (e.recurrent && mois === 7 && e.jour === 15) {
      return { ...e, jour: 20 };
    }
    return e;
  }).sort((a, b) => a.jour - b.jour);
}

/**
 * Regroupe les echeances d'un mois par jour.
 */
export function getEcheancesParJour(mois: number): Map<number, EcheanceFiscale[]> {
  const map = new Map<number, EcheanceFiscale[]>();
  for (const e of getEcheancesDuMois(mois)) {
    const list = map.get(e.jour) || [];
    list.push(e);
    map.set(e.jour, list);
  }
  return map;
}

/**
 * Genere une grille calendrier (semaines lun->dim) pour un mois/annee donnes.
 */
export function genererGrilleCalendrier(mois: number, annee: number): JourCalendrier[][] {
  const now = new Date();
  const aujourdhui = now.getDate();
  const moisActuel = now.getMonth();
  const anneeActuelle = now.getFullYear();

  const premierJour = new Date(annee, mois, 1);
  const dernierJour = new Date(annee, mois + 1, 0).getDate();

  // Jour de la semaine du 1er (0=dim, 1=lun, ..., 6=sam)
  // On veut lun=0 ... dim=6
  let jourSemaine = premierJour.getDay() - 1;
  if (jourSemaine < 0) jourSemaine = 6; // dimanche -> 6

  const echeancesMap = getEcheancesParJour(mois);
  const semaines: JourCalendrier[][] = [];
  let semaine: JourCalendrier[] = [];

  // Cases vides avant le 1er
  for (let i = 0; i < jourSemaine; i++) {
    semaine.push({ jour: null, estAujourdhui: false, estPasse: false, echeances: [] });
  }

  for (let j = 1; j <= dernierJour; j++) {
    const estAujourdhui = j === aujourdhui && mois === moisActuel && annee === anneeActuelle;
    const estPasse =
      annee < anneeActuelle ||
      (annee === anneeActuelle && mois < moisActuel) ||
      (annee === anneeActuelle && mois === moisActuel && j < aujourdhui);

    semaine.push({
      jour: j,
      estAujourdhui,
      estPasse,
      echeances: echeancesMap.get(j) || [],
    });

    if (semaine.length === 7) {
      semaines.push(semaine);
      semaine = [];
    }
  }

  // Compléter la dernière semaine
  if (semaine.length > 0) {
    while (semaine.length < 7) {
      semaine.push({ jour: null, estAujourdhui: false, estPasse: false, echeances: [] });
    }
    semaines.push(semaine);
  }

  return semaines;
}

/**
 * Calcule le nombre de jours restants avant une echeance.
 */
export function getJoursRestants(jour: number, mois: number): number {
  const now = new Date();
  const target = new Date(now.getFullYear(), mois, jour);
  // Si la date est passée cette année, on prend l'année prochaine
  if (target.getTime() < now.getTime()) {
    target.setFullYear(target.getFullYear() + 1);
  }
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Retourne la prochaine echeance fiscale (la plus proche dans le futur).
 */
export function getProchaineEcheance(): { echeance: EcheanceFiscale; joursRestants: number; date: Date } | null {
  const now = new Date();
  const jourActuel = now.getDate();
  const moisActuel = now.getMonth();

  // Chercher dans le mois en cours (jours futurs)
  const echeancesMois = getEcheancesDuMois(moisActuel);
  for (const e of echeancesMois.sort((a, b) => a.jour - b.jour)) {
    if (e.jour > jourActuel) {
      const joursRestants = e.jour - jourActuel;
      return { echeance: e, joursRestants, date: new Date(now.getFullYear(), moisActuel, e.jour) };
    }
  }

  // Sinon chercher dans le mois suivant
  const moisSuivant = (moisActuel + 1) % 12;
  const echeancesSuivant = getEcheancesDuMois(moisSuivant);
  if (echeancesSuivant.length > 0) {
    const premiere = echeancesSuivant.sort((a, b) => a.jour - b.jour)[0];
    const dateCible = new Date(now.getFullYear(), moisSuivant, premiere.jour);
    const joursRestants = Math.ceil((dateCible.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { echeance: premiere, joursRestants, date: dateCible };
  }

  return null;
}

/**
 * Nom du mois en français.
 */
const NOMS_MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function getNomMois(mois: number): string {
  return NOMS_MOIS[mois] || "";
}
