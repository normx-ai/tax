import prisma from '../utils/prisma';
import { createLogger } from '../utils/logger';

const logger = createLogger('AlertesFiscalesService');

// Types d'alertes et leurs patterns regex
const ALERTE_PATTERNS = {
  ECHEANCE: [
    /dans\s+(?:un\s+)?délai\s+(?:de\s+)?(\d+)\s+(jour|mois)/gi,
    /au\s+plus\s+tard\s+le\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/gi,
    /avant\s+le\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/gi,
    /(\d+)\s+jours?\s+(?:après|suivant|à\s+compter)/gi,
  ],
  SEUIL: [
    /(\d[\d.]*(?:\.\d+)?)\s*(?:francs?\s*CFA|FCFA|F\s*CFA)/gi,
    /supérieur(?:e)?\s+à\s+(\d[\d.]*)/gi,
    /inférieur(?:e)?\s+à\s+(\d[\d.]*)/gi,
    /n'excédant\s+pas\s+(\d[\d.]*)/gi,
    /au[- ]delà\s+de\s+(\d[\d.]*)/gi,
  ],
  TAUX: [
    /(?:taux|au\s+taux)\s+(?:de\s+)?(\d+(?:[,\.]\d+)?)\s*%/gi,
    /(\d+(?:[,\.]\d+)?)\s*%\s+(?:du|de\s+la|des)/gi,
    /retenue\s+(?:de\s+)?(\d+(?:[,\.]\d+)?)\s*%/gi,
  ],
  SANCTION: [
    /amende\s+(?:de\s+)?(\d[\d.]*)/gi,
    /pénalité\s+(?:de\s+)?(\d+(?:[,\.]\d+)?)\s*%/gi,
    /majoration\s+(?:de\s+)?(\d+(?:[,\.]\d+)?)\s*%/gi,
    /intérêt(?:s)?\s+(?:de\s+retard\s+)?(?:de\s+)?(\d+(?:[,\.]\d+)?)\s*%/gi,
  ],
  OBLIGATION: [
    /(?:sont\s+)?tenu(?:e)?s?\s+de\s+(?:déclarer|souscrire|déposer|produire)/gi,
    /déclaration\s+(?:obligatoire|annuelle|mensuelle|trimestrielle)/gi,
    /doivent?\s+(?:être\s+)?(?:déclaré|souscrit|déposé)/gi,
  ],
};

// Alertes prédéfinies par catégorie
const PREDEFINED_ALERTES = [
  // IS - Impôt sur les sociétés
  { type: 'TAUX', categorie: 'IS', titre: 'Taux IS droit commun', description: 'Taux de l\'impôt sur les sociétés applicable aux bénéfices des personnes morales (Art. 86A).', valeur: '28', unite: '%', articleNumero: '86A' },
  { type: 'TAUX', categorie: 'IS', titre: 'Minimum de perception IS', description: 'Minimum de perception : 1% des produits (exploitation + financiers + HAO) - Art. 86C.', valeur: '1', unite: '%', articleNumero: '86C' },
  { type: 'ECHEANCE', categorie: 'IS', titre: 'Déclaration IS - délai', description: 'Déclaration des résultats dans les 4 mois suivant la clôture de l\'exercice.', valeur: '4', unite: 'mois', articleNumero: '35' },
  { type: 'ECHEANCE', categorie: 'IS', titre: 'Acomptes minimum de perception IS', description: 'Le minimum de perception est versé en 4 acomptes trimestriels : 15 mars, 15 juin, 15 septembre, 15 décembre (Art. 86C).', valeur: '4', unite: 'trimestres', periodicite: 'trimestriel', articleNumero: '86C' },

  // IBA
  { type: 'TAUX', categorie: 'IBA', titre: 'Taux IBA régime réel', description: 'Taux de l\'impôt sur les bénéfices d\'affaires pour les contribuables du régime réel.', valeur: '25', unite: '%', articleNumero: '92' },
  { type: 'SEUIL', categorie: 'IBA', titre: 'Seuil régime réel IBA', description: 'Chiffre d\'affaires à partir duquel le régime réel est obligatoire.', valeur: '200.000.000', unite: 'FCFA', articleNumero: '92B' },
  { type: 'SEUIL', categorie: 'IBA', titre: 'Seuil régime simplifié IBA', description: 'Chiffre d\'affaires jusqu\'auquel le régime simplifié est applicable.', valeur: '50.000.000', unite: 'FCFA', articleNumero: '92C' },
  { type: 'TAUX', categorie: 'IBA', titre: 'Base forfaitaire non-résidents', description: 'Application d\'un pourcentage forfaitaire du chiffre d\'affaires pour les personnes morales étrangères.', valeur: '22', unite: '%', articleNumero: '92A' },

  // ITS — Barème Art. 116-G CGI 2026
  { type: 'TAUX', categorie: 'ITS', titre: 'Barème ITS tranche 1', description: 'Revenus de 0 à 615.000 FCFA : forfait 1.200 FCFA.', valeur: '1200', unite: 'FCFA', articleNumero: '116-G' },
  { type: 'TAUX', categorie: 'ITS', titre: 'Barème ITS tranche 2', description: 'Revenus de 615.001 à 1.500.000 FCFA.', valeur: '10', unite: '%', articleNumero: '116-G' },
  { type: 'TAUX', categorie: 'ITS', titre: 'Barème ITS tranche 3', description: 'Revenus de 1.500.001 à 3.500.000 FCFA.', valeur: '15', unite: '%', articleNumero: '116-G' },
  { type: 'TAUX', categorie: 'ITS', titre: 'Barème ITS tranche 4', description: 'Revenus de 3.500.001 à 5.000.000 FCFA.', valeur: '20', unite: '%', articleNumero: '116-G' },
  { type: 'TAUX', categorie: 'ITS', titre: 'Barème ITS tranche 5', description: 'Revenus supérieurs à 5.000.001 FCFA.', valeur: '30', unite: '%', articleNumero: '116-G' },
  { type: 'ECHEANCE', categorie: 'ITS', titre: 'Déclaration ITS employeur', description: 'Déclaration mensuelle des retenues ITS par l\'employeur.', valeur: '15', unite: 'jour', periodicite: 'mensuel', articleNumero: '120' },

  // IRCM
  { type: 'TAUX', categorie: 'IRCM', titre: 'Taux IRCM dividendes', description: 'Retenue à la source sur les dividendes distribués.', valeur: '15', unite: '%', articleNumero: '104' },
  { type: 'TAUX', categorie: 'IRCM', titre: 'Taux IRCM intérêts', description: 'Retenue à la source sur les intérêts des comptes courants et dépôts.', valeur: '15', unite: '%', articleNumero: '104' },
  { type: 'ECHEANCE', categorie: 'IRCM', titre: 'Reversement IRCM', description: 'Reversement de la retenue IRCM dans les 15 jours suivant le mois de distribution.', valeur: '15', unite: 'jour', periodicite: 'mensuel', articleNumero: '106' },

  // IRF
  { type: 'TAUX', categorie: 'IRF', titre: 'Taux IRF loyers', description: 'Taux de l\'impôt sur les revenus fonciers appliqué aux loyers.', valeur: '9', unite: '%', articleNumero: '113' },
  { type: 'OBLIGATION', categorie: 'IRF', titre: 'Retenue IRF locataire', description: 'Les locataires personnes morales doivent effectuer une retenue à la source sur les loyers versés.', articleNumero: '113' },
  { type: 'ECHEANCE', categorie: 'IRF', titre: 'Déclaration IRF', description: 'Reversement mensuel de la retenue IRF dans les 15 jours suivant le mois.', valeur: '15', unite: 'jour', periodicite: 'mensuel', articleNumero: '113' },

  // TVA
  { type: 'TAUX', categorie: 'TVA', titre: 'Taux normal TVA', description: 'Taux normal de la TVA applicable aux biens et services.', valeur: '18', unite: '%', articleNumero: 'DC-1' },
  { type: 'TAUX', categorie: 'TVA', titre: 'Taux réduit TVA', description: 'Taux réduit de la TVA applicable à certains biens de première nécessité.', valeur: '9', unite: '%', articleNumero: 'DC-2' },
  { type: 'ECHEANCE', categorie: 'TVA', titre: 'Déclaration TVA mensuelle', description: 'Déclaration et paiement de la TVA au plus tard le 15 du mois suivant.', valeur: '15', unite: 'jour', periodicite: 'mensuel', articleNumero: 'DC-10' },
  { type: 'SEUIL', categorie: 'TVA', titre: 'Seuil assujettissement TVA', description: 'Chiffre d\'affaires à partir duquel l\'assujettissement à la TVA est obligatoire.', valeur: '50.000.000', unite: 'FCFA', articleNumero: 'DC-3' },

  // Déclarations
  { type: 'ECHEANCE', categorie: 'DECLARATIONS', titre: 'Déclaration annuelle revenus', description: 'Date limite de dépôt de la déclaration annuelle des revenus.', valeur: '30', unite: 'jour', articleNumero: '35' },
  { type: 'OBLIGATION', categorie: 'DECLARATIONS', titre: 'Obligation déclarative générale', description: 'Toute personne physique ou morale exerçant une activité imposable doit souscrire une déclaration.', articleNumero: '35' },
  // Art. 132 CGI Tome 1 Chapitre 4 - Déclaration des revenus des personnes physiques
  { type: 'OBLIGATION', categorie: 'DECLARATIONS', titre: 'Déclaration annuelle des revenus — salariés et particuliers', description: 'Toute personne physique percevant des salaires, traitements, pensions, rentes viagères, revenus fonciers, revenus de capitaux mobiliers ou plus-values de cession est tenue de souscrire une déclaration annuelle de revenus auprès de l\'Unité de la fiscalité des particuliers de son lieu de résidence, au plus tard le 20 mars de l\'année qui suit celle de la disposition des revenus.', articleNumero: '132' },
  { type: 'ECHEANCE', categorie: 'DECLARATIONS', titre: 'Déclaration personnes physiques — salaires, pensions, fonciers, capitaux', description: 'Date limite de dépôt de la déclaration des revenus des personnes physiques (salariés, retraités, propriétaires bailleurs, détenteurs de capitaux mobiliers).', valeur: '20', unite: 'jour', periodicite: 'annuel', articleNumero: '132' },
  { type: 'ECHEANCE', categorie: 'DECLARATIONS', titre: 'Déclaration spéciale cédules bénéfice d\'affaires (OHADA)', description: 'Personnes physiques relevant des cédules de bénéfice d\'affaires et présentant des états financiers OHADA : déclaration au plus tard le 20 mai de l\'année suivante, après déduction des acomptes IBA.', valeur: '20', unite: 'jour', periodicite: 'annuel', articleNumero: '132' },
  { type: 'ECHEANCE', categorie: 'DECLARATIONS', titre: 'Déclaration mixte (particulier + bénéfice d\'affaires)', description: 'Personnes physiques relevant à la fois de la déclaration des particuliers et des cédules de bénéfice d\'affaires : déclaration auprès de l\'unité de la fiscalité des particuliers au plus tard le 20 juin de l\'année suivante.', valeur: '20', unite: 'jour', periodicite: 'annuel', articleNumero: '132' },
  // Art. 391 bis CGI Tome 1 - Obligation de déclaration des comptes bancaires
  { type: 'OBLIGATION', categorie: 'DECLARATIONS', titre: 'Déclaration ouverture/clôture de compte bancaire commercial', description: 'Toute entreprise ou personne assimilée doit déclarer au service d\'assiette l\'ouverture ou la clôture de tout compte commercial auprès d\'une banque ou d\'un établissement de crédit, dans les 15 jours qui suivent l\'opération. Elle doit aussi déclarer tous ses comptes commerciaux dans les 20 premiers jours de janvier.', articleNumero: '391 bis' },
  { type: 'ECHEANCE', categorie: 'DECLARATIONS', titre: 'Déclaration annuelle des comptes bancaires commerciaux', description: 'Déclaration au plus tard le 20 janvier de tous les comptes commerciaux détenus au 31 décembre (imprimé administration fiscale : date d\'ouverture, établissement, RIB/IBAN, NIU).', valeur: '20', unite: 'jour', periodicite: 'annuel', articleNumero: '391 bis' },
  { type: 'SANCTION', categorie: 'SANCTIONS', titre: 'Sanction défaut de déclaration de compte bancaire', description: 'Les manquements exposent le contribuable à la non-déduction des charges payées sur un compte non déclaré, ou à une amende de 3 000 000 FCFA pour les entreprises exonérées d\'impôt sur le revenu.', valeur: '3.000.000', unite: 'FCFA', articleNumero: '391 bis' },

  // Sanctions
  { type: 'SANCTION', categorie: 'SANCTIONS', titre: 'Pénalité retard déclaration', description: 'Majoration pour dépôt tardif de déclaration fiscale.', valeur: '10', unite: '%', articleNumero: '170' },
  { type: 'SANCTION', categorie: 'SANCTIONS', titre: 'Pénalité retard paiement', description: 'Intérêts de retard pour paiement tardif d\'impôts.', valeur: '1.5', unite: '%', periodicite: 'mensuel', articleNumero: '171' },
  { type: 'SANCTION', categorie: 'SANCTIONS', titre: 'Amende défaut déclaration', description: 'Amende forfaitaire pour absence de déclaration.', valeur: '200.000', unite: 'FCFA', articleNumero: '172' },
  { type: 'SANCTION', categorie: 'SANCTIONS', titre: 'Majoration insuffisance déclaration', description: 'Majoration en cas d\'insuffisance de déclaration constatée lors d\'un contrôle.', valeur: '30', unite: '%', articleNumero: '173' },
  { type: 'SANCTION', categorie: 'SANCTIONS', titre: 'Majoration mauvaise foi', description: 'Majoration pour mauvaise foi du contribuable.', valeur: '50', unite: '%', articleNumero: '174' },
  { type: 'SANCTION', categorie: 'SANCTIONS', titre: 'Majoration fraude fiscale', description: 'Majoration pour manoeuvres frauduleuses.', valeur: '100', unite: '%', articleNumero: '175' },

  // Prix de transfert
  { type: 'OBLIGATION', categorie: 'PRIX_TRANSFERT', titre: 'Documentation prix de transfert', description: 'Les entreprises liées doivent tenir une documentation justifiant leur politique de prix de transfert.', articleNumero: '36' },
  { type: 'SEUIL', categorie: 'PRIX_TRANSFERT', titre: 'Seuil documentation prix de transfert', description: 'Seuil de chiffre d\'affaires au-delà duquel la documentation est obligatoire.', valeur: '500.000.000', unite: 'FCFA', articleNumero: '36' },

  // Patente
  { type: 'ECHEANCE', categorie: 'PATENTE', titre: 'Paiement patente', description: 'Paiement annuel de la contribution des patentes.', periodicite: 'annuel', articleNumero: 'IL-1' },
  { type: 'OBLIGATION', categorie: 'PATENTE', titre: 'Déclaration patente', description: 'Toute personne exerçant un commerce, une industrie ou une profession doit être inscrite au rôle des patentes.', articleNumero: 'IL-2' },

  // Foncier
  { type: 'ECHEANCE', categorie: 'FONCIER_BATI', titre: 'Paiement foncier bâti', description: 'Paiement annuel de la contribution foncière sur les propriétés bâties.', periodicite: 'annuel', articleNumero: 'IL-10' },
  { type: 'TAUX', categorie: 'FONCIER_BATI', titre: 'Taux foncier bâti', description: 'Taux de la contribution foncière sur les propriétés bâties.', valeur: '15', unite: '%', articleNumero: 'IL-11' },
  { type: 'ECHEANCE', categorie: 'FONCIER_NON_BATI', titre: 'Paiement foncier non bâti', description: 'Paiement annuel de la contribution foncière sur les propriétés non bâties.', periodicite: 'annuel', articleNumero: 'IL-20' },

  // Minimum de perception
  { type: 'SEUIL', categorie: 'MINIMUM_PERCEPTION', titre: 'Minimum perception IS', description: 'Minimum de perception annuel pour l\'IS.', valeur: '1.000.000', unite: 'FCFA', articleNumero: '86A' },
  { type: 'TAUX', categorie: 'MINIMUM_PERCEPTION', titre: 'Minimum perception taux CA', description: 'Taux du minimum de perception calculé sur les produits (Art. 86C).', valeur: '1', unite: '%', articleNumero: '86C' },

  // Personnes morales étrangères
  { type: 'TAUX', categorie: 'PM_ETRANGERES', titre: 'Retenue source PM étrangères', description: 'Retenue à la source sur les sommes versées aux personnes morales étrangères.', valeur: '20', unite: '%', articleNumero: '92A' },
  { type: 'OBLIGATION', categorie: 'PM_ETRANGERES', titre: 'Déclaration PM étrangères', description: 'Les entreprises versant des sommes à des PM étrangères doivent effectuer une retenue à la source.', articleNumero: '92A' },

  // Vérification
  { type: 'ECHEANCE', categorie: 'VERIFICATION', titre: 'Durée vérification fiscale', description: 'Durée maximale de la vérification de comptabilité sur place.', valeur: '3', unite: 'mois', articleNumero: '160' },
  { type: 'OBLIGATION', categorie: 'VERIFICATION', titre: 'Droit de communication', description: 'L\'administration dispose d\'un droit de communication auprès des tiers.', articleNumero: '155' },

  // Réclamations
  { type: 'ECHEANCE', categorie: 'RECLAMATIONS', titre: 'Délai réclamation', description: 'Délai pour adresser une réclamation contentieuse à l\'administration fiscale.', valeur: '2', unite: 'mois', articleNumero: '180' },
  { type: 'ECHEANCE', categorie: 'RECLAMATIONS', titre: 'Délai réponse administration', description: 'Délai imparti à l\'administration pour répondre à une réclamation.', valeur: '4', unite: 'mois', articleNumero: '181' },

  // Recouvrement
  { type: 'ECHEANCE', categorie: 'RECOUVREMENT', titre: 'Prescription fiscale', description: 'Délai de prescription pour le recouvrement des créances fiscales.', valeur: '4', unite: 'ans', articleNumero: '185' },

  // Taxes diverses
  { type: 'TAUX', categorie: 'TAXE_VEHICULES', titre: 'Taxe véhicules tourisme', description: 'Taxe annuelle sur les véhicules de tourisme des sociétés.', articleNumero: 'TD-1' },
  { type: 'ECHEANCE', categorie: 'TAXE_TERRAINS', titre: 'Taxe terrains insuffisamment bâtis', description: 'Paiement annuel de la taxe sur les terrains insuffisamment bâtis.', periodicite: 'annuel', articleNumero: 'TD-10' },
];

export async function getAllAlertes(options: { type?: string; categorie?: string; actif?: boolean; page?: number; limit?: number } = {}) {
  const page = options.page || 1;
  const limit = options.limit || 100;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (options.type) where.type = options.type;
  if (options.categorie) where.categorie = options.categorie;
  if (options.actif !== undefined) where.actif = options.actif;
  else where.actif = true;

  const [alertes, total] = await Promise.all([
    prisma.alerteFiscale.findMany({
      where,
      orderBy: [{ categorie: 'asc' }, { type: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.alerteFiscale.count({ where }),
  ]);

  return { alertes, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getStats() {
  const [total, byType, byCategorie] = await Promise.all([
    prisma.alerteFiscale.count({ where: { actif: true } }),
    prisma.alerteFiscale.groupBy({ by: ['type'], _count: true, where: { actif: true } }),
    prisma.alerteFiscale.groupBy({ by: ['categorie'], _count: true, where: { actif: true } }),
  ]);

  return {
    total,
    byType: byType.map(t => ({ type: t.type, count: t._count })),
    byCategorie: byCategorie.map(c => ({ categorie: c.categorie, count: c._count })),
  };
}

export async function getByArticle(articleNumero: string) {
  return prisma.alerteFiscale.findMany({
    where: { articleNumero, actif: true },
    orderBy: { type: 'asc' },
  });
}

export async function extractFromText(text: string): Promise<Array<{ type: string; match: string; value?: string; unite?: string }>> {
  const results: Array<{ type: string; match: string; value?: string; unite?: string }> = [];

  for (const [type, patterns] of Object.entries(ALERTE_PATTERNS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        results.push({
          type,
          match: match[0],
          value: match[1],
          unite: match[2],
        });
      }
    }
  }

  return results;
}

export async function seedPredefinedAlertes() {
  let created = 0;
  let skipped = 0;

  for (const alerte of PREDEFINED_ALERTES) {
    try {
      await prisma.alerteFiscale.upsert({
        where: {
          articleNumero_type_valeur_version: {
            articleNumero: alerte.articleNumero,
            type: alerte.type as never,
            valeur: alerte.valeur || '',
            version: '2026',
          },
        },
        update: {
          titre: alerte.titre,
          description: alerte.description,
          unite: alerte.unite,
          periodicite: alerte.periodicite,
          categorie: alerte.categorie as never,
          actif: true,
        },
        create: {
          type: alerte.type as never,
          categorie: alerte.categorie as never,
          titre: alerte.titre,
          description: alerte.description,
          valeur: alerte.valeur,
          unite: alerte.unite,
          periodicite: alerte.periodicite,
          articleNumero: alerte.articleNumero,
          version: '2026',
        },
      });
      created++;
    } catch (err) {
      logger.warn(`Alerte skip: ${alerte.titre}`, err);
      skipped++;
    }
  }

  logger.info(`Seed alertes: ${created} créées/mises à jour, ${skipped} ignorées`);
  return { created, skipped, total: PREDEFINED_ALERTES.length };
}
