// server/src/services/rag/hybrid-search.routing.ts
// Routage direct par mots-clés et règles de priorité
// Copie de cgi-engine adaptée (sans .js)

import { createLogger } from '../../utils/logger';

const logger = createLogger('HybridSearchRouting');

/**
 * Mappings directs: mot-clé exact → article à forcer en position 1
 */
export const DIRECT_KEYWORD_MAPPINGS: Record<string, string> = {
  // Art. 92A - Base forfaitaire étrangers
  '22%': 'Art. 92A',
  'vingt-deux pour cent': 'Art. 92A',
  'base forfaitaire': 'Art. 92A',
  'forfaitaire étrangers': 'Art. 92A',
  'forfaitaire pm': 'Art. 92A',
  'assiette forfaitaire': 'Art. 92A',
  'mobilisation': 'Art. 92A',
  'démobilisation': 'Art. 92A',
  'demobilisation': 'Art. 92A',
  'mob demob': 'Art. 92A',

  // Art. 92J - Régime dérogatoire pétrolier
  '70%': 'Art. 92J',
  'soixante-dix': 'Art. 92J',
  'seuil pétrolier': 'Art. 92J',
  'seuil ca pétrolier': 'Art. 92J',
  'régime dérogatoire': 'Art. 92J',
  'regime derogatoire': 'Art. 92J',
  'dérogatoire pétrolier': 'Art. 92J',
  'catering': 'Art. 92J',
  'restauration pétrolier': 'Art. 92J',
  'restauration sites': 'Art. 92J',
  'cantine pétrolier': 'Art. 92J',
  'charte investissements': 'Art. 92J',
  'charte des investissements': 'Art. 92J',
  'éligible charte': 'Art. 92J',
  'eligible charte': 'Art. 92J',
  'non éligible charte': 'Art. 92J',
  'non eligible charte': 'Art. 92J',

  // Art. 26 - Plafond espèces
  '200.000 fcfa': 'Art. 26',
  '200000': 'Art. 26',
  'espèces': 'Art. 26',
  'especes': 'Art. 26',
  'paiement cash': 'Art. 26',
  'numéraire': 'Art. 26',
  'numeraire': 'Art. 26',

  // ========== IS - IMPOT SUR LES SOCIETES ==========
  // Art. 3 - Exonérations IS
  'exonération is': 'Art. 3',
  'exoneration is': 'Art. 3',
  'exonérations is': 'Art. 3',
  'exonerations is': 'Art. 3',
  "exonération de l'is": 'Art. 3',
  "exoneration de l'is": 'Art. 3',
  "exonérées de l'impôt sur les sociétés": 'Art. 3',
  "exonerees de l'impot sur les societes": 'Art. 3',
  // Art. 86A - Taux IS
  'taux is': 'Art. 86A',
  "taux de l'is": 'Art. 86A',
  "taux impôt sur les sociétés": 'Art. 86A',
  "taux impot sur les societes": 'Art. 86A',
  // Art. 86C - Minimum de perception IS
  'minimum perception is': 'Art. 86C',
  'minimum de perception': 'Art. 86C',

  // ========== IRF - IMPOT SUR LE REVENU FONCIER ==========
  // Art. 113 - Taux IRF
  'taux irf': 'Art. 113',
  'taux de l\'irf': 'Art. 113',
  '9% loyers': 'Art. 113',
  '15% plus-values': 'Art. 113',
  'taux loyers': 'Art. 113',
  'taux revenus fonciers': 'Art. 113',
  'taux plus-values immobilières': 'Art. 113',
  'taux plus-values immobilieres': 'Art. 113',

  // Art. 113A - Retenue IRF
  'retenue irf': 'Art. 113A',
  'retenue loyers': 'Art. 113A',
  'retenue libératoire irf': 'Art. 113A',
  'retenue liberatoire irf': 'Art. 113A',
  'date limite retenue': 'Art. 113A',
  '15 mars irf': 'Art. 113A',
  'nouveau bail': 'Art. 113A',

  // Art. 111C - Exonérations IRF
  'exonération irf': 'Art. 111C',
  'exoneration irf': 'Art. 111C',
  'résidence principale': 'Art. 111C',
  'residence principale': 'Art. 111C',
  'irf famille': 'Art. 111C',
  'exonération famille': 'Art. 111C',
  'exoneration famille': 'Art. 111C',
};

/**
 * Règles de routage avec contexte
 */
export interface RoutingRule {
  id: string;
  keywordsRequired: string[];
  keywordsContext?: string[];
  routeTo: string;
  boost: number;
}

export const ROUTING_RULES: RoutingRule[] = [
  {
    id: 'R1_forfaitaire_etrangers',
    keywordsRequired: ['base forfaitaire', '22%', 'forfaitaire', 'assiette forfaitaire'],
    keywordsContext: ['étrang', 'pm', 'personne morale', 'calcul', 'comment'],
    routeTo: 'Art. 92A',
    boost: 3.0,
  },
  {
    id: 'R2_mobilisation',
    keywordsRequired: ['mobilisation', 'démobilisation', 'demobilisation', 'mob', 'demob', 'installation chantier', 'repli'],
    routeTo: 'Art. 92A',
    boost: 3.0,
  },
  {
    id: 'R3_seuil_petrolier',
    keywordsRequired: ['70%', 'seuil', 'soixante-dix'],
    keywordsContext: ['pétrol', 'petrol', 'dérogatoire', 'derogatoire', 'ca'],
    routeTo: 'Art. 92J',
    boost: 3.0,
  },
  {
    id: 'R4_catering',
    keywordsRequired: ['catering', 'restauration', 'cantine'],
    keywordsContext: ['pétrol', 'petrol', 'site', 'dérogatoire', 'derogatoire', 'sous-traitant'],
    routeTo: 'Art. 92J',
    boost: 3.0,
  },
  {
    id: 'R5_charte',
    keywordsRequired: ['charte', 'investissement'],
    keywordsContext: ['pétrol', 'petrol', 'dérogatoire', 'derogatoire', 'éligible', 'eligible', 'sous-traitant'],
    routeTo: 'Art. 92J',
    boost: 3.0,
  },
  {
    id: 'R6_especes',
    keywordsRequired: ['espèces', 'especes', 'cash', 'liquide', 'numéraire', 'numeraire'],
    keywordsContext: ['plafond', 'maximum', 'déductible', 'deductible', '200', 'charge'],
    routeTo: 'Art. 26',
    boost: 3.0,
  },
  // ========== IRF - IMPOT SUR LE REVENU FONCIER ==========
  {
    id: 'R7_irf_taux_plus_values',
    keywordsRequired: ['taux', 'plus-value', 'plus-values'],
    keywordsContext: ['irf', 'immobilier', 'immobilière', 'immobilieres', 'foncier', '15%'],
    routeTo: 'Art. 113',
    boost: 3.0,
  },
  {
    id: 'R8_irf_retenue',
    keywordsRequired: ['retenue', 'source'],
    keywordsContext: ['irf', 'loyer', 'foncier', 'locataire', 'libératoire', 'liberatoire', 'date', '15 mars'],
    routeTo: 'Art. 113A',
    boost: 3.0,
  },
  {
    id: 'R9_irf_exoneration',
    keywordsRequired: ['exonér', 'exoner', 'dispense'],
    keywordsContext: ['irf', 'foncier', 'résidence', 'residence', 'famille', 'enfant', 'principal'],
    routeTo: 'Art. 111C',
    boost: 3.0,
  },
  {
    id: 'R10_irf_nouveau_bail',
    keywordsRequired: ['nouveau bail', 'bail'],
    keywordsContext: ['retenue', 'irf', 'délai', 'delai', '3 mois'],
    routeTo: 'Art. 113A',
    boost: 3.0,
  },
  {
    id: 'R11_irf_liberatoire',
    keywordsRequired: ['libératoire', 'liberatoire'],
    keywordsContext: ['irf', 'retenue', 'foncier', 'loyer'],
    routeTo: 'Art. 113A',
    boost: 3.0,
  },
  // ========== IS - IMPOT SUR LES SOCIETES ==========
  {
    id: 'R13_exoneration_is',
    keywordsRequired: ['exonér', 'exoner', 'exemption', 'dispense'],
    keywordsContext: ['is', 'sociét', 'societ', 'entreprise', 'nouvelle'],
    routeTo: 'Art. 3',
    boost: 3.0,
  },
  {
    id: 'R14_taux_is',
    keywordsRequired: ['taux', '28%', '25%', '33%'],
    keywordsContext: ['is', 'sociét', 'societ', 'impôt sur les', 'impot sur les'],
    routeTo: 'Art. 86A',
    boost: 3.0,
  },
  {
    id: 'R12_logement_gratuit_famille',
    keywordsRequired: ['gratuitement', 'gratuit'],
    keywordsContext: ['enfant', 'famille', 'logement', 'loyer', 'imposable'],
    routeTo: 'Art. 111C',
    boost: 3.0,
  },
];

export interface RoutingResult {
  article: string;
  boost: number;
  ruleId: string;
}

/**
 * Vérifie les mappings directs et retourne l'article à forcer
 */
export function checkDirectMappings(query: string): string | null {
  const queryLower = query.toLowerCase();

  for (const [keyword, article] of Object.entries(DIRECT_KEYWORD_MAPPINGS)) {
    if (queryLower.includes(keyword.toLowerCase())) {
      logger.info(`[Routing] DIRECT MAPPING: "${keyword}" → ${article}`);
      return article;
    }
  }
  return null;
}

/**
 * Applique les règles de routage et retourne l'article à forcer avec boost
 */
export function applyRoutingRules(query: string): RoutingResult | null {
  const queryLower = query.toLowerCase();

  for (const rule of ROUTING_RULES) {
    const hasRequiredKeyword = rule.keywordsRequired.some(kw =>
      queryLower.includes(kw.toLowerCase())
    );

    if (!hasRequiredKeyword) continue;

    if (rule.keywordsContext && rule.keywordsContext.length > 0) {
      const hasContext = rule.keywordsContext.some(kw =>
        queryLower.includes(kw.toLowerCase())
      );
      if (hasContext) {
        logger.info(`[Routing] RULE ${rule.id}: matched with context → ${rule.routeTo}`);
        return { article: rule.routeTo, boost: rule.boost, ruleId: rule.id };
      }
    } else {
      logger.info(`[Routing] RULE ${rule.id}: matched → ${rule.routeTo}`);
      return { article: rule.routeTo, boost: rule.boost, ruleId: rule.id };
    }
  }

  return null;
}

export default {
  DIRECT_KEYWORD_MAPPINGS,
  ROUTING_RULES,
  checkDirectMappings,
  applyRoutingRules,
};
