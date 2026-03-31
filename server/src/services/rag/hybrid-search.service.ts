// server/src/services/rag/hybrid-search.service.ts
// Service de recherche hybride: keyword + vectorielle
// Copie de cgi-engine adaptée (Voyage AI 1024 dims, sans .js, version défaut 2026)

import { generateEmbedding } from './embeddings.service';
import { getQdrantClient } from './qdrant.service';
import { createLogger } from '../../utils/logger';
import { checkDirectMappings, applyRoutingRules } from './hybrid-search.routing';
import { extractKeywordMatches, getMetadataForArticle } from './hybrid-search.chapters';

const logger = createLogger('HybridSearch');

const client = getQdrantClient();

// Collections CGI + Social
export const CGI_COLLECTION = 'cgi_2026';
export const SOCIAL_COLLECTION = 'social_2026';

export const CGI_COLLECTIONS = {
  '2025': 'cgi_2025',
  '2026': 'cgi_2026',
  'current': 'cgi_2026',
  'social': 'social_2026',
} as const;

export type CGIVersion = keyof typeof CGI_COLLECTIONS;

// Mots-clés pour détecter les questions sociales
const SOCIAL_KEYWORDS = [
  'code du travail', 'code social', 'droit du travail', 'droit social',
  'licenciement', 'préavis', 'preavis', 'congé', 'conge', 'congés payés',
  'contrat de travail', 'cdd', 'cdi', 'période d\'essai', 'periode d\'essai',
  'convention collective', 'salaire minimum', 'smig', 'smic',
  'heures supplémentaires', 'heures supplementaires', 'durée du travail',
  'syndicat', 'grève', 'greve', 'délégué du personnel', 'comité d\'entreprise',
  'inspection du travail', 'inspecteur du travail',
  'sécurité sociale', 'securite sociale', 'cnss', 'caisse nationale',
  'cotisation sociale', 'cotisations sociales', 'cotisation cnss',
  'prestations familiales', 'allocation familiale', 'allocations familiales',
  'accident du travail', 'maladie professionnelle', 'risques professionnels',
  'pension de vieillesse', 'pension d\'invalidité', 'pension invalidite',
  'retraite', 'âge de retraite', 'age de retraite', 'pension de retraite',
  'indemnité journalière', 'indemnite journaliere',
  'maternité', 'maternite', 'congé maternité', 'conge maternite',
  'camu', 'couverture maladie', 'assurance maladie',
  'onemo', 'acpe', 'fonea', 'ints',
  'jours fériés', 'jours feries', 'jour férié',
  'personnel domestique', 'employé de maison',
  'cipres', 'ohada',
  'rente', 'survivant', 'ayants droit',
  'saisie-arrêt', 'saisie arret', 'saisie sur salaire',
  'apprentissage', 'apprenti', 'formation professionnelle',
  'hygiène', 'hygiene', 'sécurité au travail',
  'différend collectif', 'differend', 'tribunal du travail',
];

/**
 * Détecte si la question concerne le Code Social
 */
export function isSocialQuery(query: string): boolean {
  const queryLower = query.toLowerCase();
  return SOCIAL_KEYWORDS.some(kw => queryLower.includes(kw));
}

export interface ArticlePayload {
  numero: string;
  titre: string;
  contenu: string;
  mots_cles?: string[];
  tome?: string;
  chapitre?: string;
}

export interface SearchResult {
  id: string | number;
  score: number;
  payload: ArticlePayload;
  matchType: 'vector' | 'keyword' | 'both';
  priority: number;
  articleType?: string;
}

/**
 * Normalise le numéro d'article pour la recherche
 */
function normalizeArticleNumber(numero: string): string {
  return numero.replace(/^Art\.\s*/i, '');
}

/**
 * Recherche des articles par numéro exact dans Qdrant
 */
async function searchByArticleNumbers(
  articleNumbers: string[],
  collectionName: string,
  version: CGIVersion
): Promise<SearchResult[]> {
  if (articleNumbers.length === 0) return [];

  const results: SearchResult[] = [];
  const seenNumeros = new Set<string>();

  for (const numero of articleNumbers.slice(0, 5)) {
    const normalizedNum = normalizeArticleNumber(numero);

    if (seenNumeros.has(normalizedNum)) continue;
    seenNumeros.add(normalizedNum);

    try {
      // Chercher d'abord dans le Tome 1 (articles principaux IS/IRPP)
      let scrollResult = await client.scroll(collectionName, {
        filter: {
          must: [
            {
              should: [
                { key: 'numero', match: { value: normalizedNum } },
                { key: 'numero', match: { value: `Art. ${normalizedNum}` } },
              ],
            },
            {
              should: [
                { key: 'tome', match: { value: '1' } },
                { key: 'tome', match: { value: 'P1' } },
              ],
            },
          ],
        },
        limit: 1,
        with_payload: true,
        with_vector: false,
      });

      // Si pas trouvé dans Tome 1, chercher dans tous les tomes
      if (scrollResult.points.length === 0) {
        scrollResult = await client.scroll(collectionName, {
          filter: {
            should: [
              { key: 'numero', match: { value: normalizedNum } },
              { key: 'numero', match: { value: `Art. ${normalizedNum}` } },
            ],
          },
          limit: 1,
          with_payload: true,
          with_vector: false,
        });
      }

      if (scrollResult.points.length > 0) {
        const point = scrollResult.points[0];
        const rawPayload = point.payload as Record<string, string | string[] | undefined>;
        const payload: ArticlePayload = {
          numero: String(rawPayload.numero || ''),
          titre: String(rawPayload.titre || ''),
          contenu: String(rawPayload.contenu || ''),
          mots_cles: Array.isArray(rawPayload.mots_cles) ? rawPayload.mots_cles : undefined,
          tome: rawPayload.tome ? String(rawPayload.tome) : undefined,
          chapitre: rawPayload.chapitre ? String(rawPayload.chapitre) : undefined,
        };

        const metadata = getMetadataForArticle(payload.numero, version);

        results.push({
          id: point.id,
          score: 1.0,
          payload,
          matchType: 'keyword',
          priority: metadata.priority,
          articleType: metadata.articleType,
        });

        logger.debug(`[HybridSearch] Art. ${payload.numero} trouvé (P${metadata.priority})`);
      }
    } catch (error) {
      logger.error(`[HybridSearch] Erreur recherche article ${numero}:`, error);
    }
  }

  return results;
}

/**
 * Recherche vectorielle standard
 */
async function searchByVector(
  query: string,
  limit: number,
  collectionName: string,
  version: CGIVersion
): Promise<SearchResult[]> {
  try {
    const { embedding } = await generateEmbedding(query);

    const searchResult = await client.search(collectionName, {
      vector: embedding,
      limit,
      with_payload: true,
    });

    return searchResult.map((result) => {
      const rawPayload = result.payload as Record<string, string | string[] | undefined>;
      const payload: ArticlePayload = {
        numero: String(rawPayload.numero || ''),
        titre: String(rawPayload.titre || ''),
        contenu: String(rawPayload.contenu || ''),
        mots_cles: Array.isArray(rawPayload.mots_cles) ? rawPayload.mots_cles : undefined,
        tome: rawPayload.tome ? String(rawPayload.tome) : undefined,
        chapitre: rawPayload.chapitre ? String(rawPayload.chapitre) : undefined,
      };

      const metadata = getMetadataForArticle(payload.numero, version);

      return {
        id: result.id,
        score: result.score,
        payload,
        matchType: 'vector' as const,
        priority: metadata.priority,
        articleType: metadata.articleType,
      };
    });
  } catch (error) {
    logger.error('[HybridSearch] Erreur recherche vectorielle:', error);
    return [];
  }
}

/**
 * Fusionne les résultats avec priorisation intelligente
 */
function mergeResults(
  keywordResults: SearchResult[],
  vectorResults: SearchResult[],
  maxResults: number
): SearchResult[] {
  const seen = new Set<string>();
  const merged: SearchResult[] = [];

  // Ajouter les résultats keyword
  for (const result of keywordResults) {
    const key = result.payload.numero;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(result);
    }
  }

  // Ajouter les résultats vectoriels non dupliqués
  for (const result of vectorResults) {
    const key = result.payload.numero;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(result);
    } else {
      const existing = merged.find((r) => r.payload.numero === key);
      if (existing && existing.matchType === 'keyword') {
        existing.matchType = 'both';
        existing.score = Math.max(existing.score, result.score);
      }
    }
  }

  // Trier par priorité et type
  const typeOrder: Record<string, number> = {
    'définition': 0,
    'calcul': 1,
    'exonération': 1,
    'procédure': 2,
    'application': 3,
    'sanction': 4
  };
  const matchOrder: Record<string, number> = { 'keyword': 0, 'both': 0, 'vector': 1 };

  merged.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const typeA = typeOrder[a.articleType || ''] ?? 5;
    const typeB = typeOrder[b.articleType || ''] ?? 5;
    if (typeA !== typeB) return typeA - typeB;
    return (matchOrder[a.matchType] ?? 1) - (matchOrder[b.matchType] ?? 1);
  });

  return merged.slice(0, maxResults);
}

/**
 * Règles de priorité spéciales
 */
function applyPriorityRules(query: string, results: SearchResult[]): SearchResult[] {
  const queryLower = query.toLowerCase();

  // Bons de caisse + précompte → Art. 61 PRIORITAIRE
  const isBonsCaisse = queryLower.includes('bons') && queryLower.includes('caisse');
  const isPrecompte = ['précompte', 'precompte', 'déclarer', 'declarer', 'irpp', 'libératoire', '15%']
    .some(kw => queryLower.includes(kw));

  if (isBonsCaisse && isPrecompte) {
    logger.info('[HybridSearch] PRIORITY: Bons de caisse + précompte → Art. 61');
    const art61Idx = results.findIndex(r => r.payload.numero === '61');
    if (art61Idx > 0) {
      const art61 = results[art61Idx];
      art61.priority = 0;
      results.splice(art61Idx, 1);
      results.unshift(art61);
    }

    const art76Idx = results.findIndex(r => r.payload.numero === '76');
    if (art76Idx !== -1 && art76Idx < 3) {
      const art76 = results[art76Idx];
      art76.priority = 5;
      results.splice(art76Idx, 1);
      results.push(art76);
    }
  }

  // Artiste étranger → Art. 49 PRIORITAIRE
  const isArtiste = queryLower.includes('artiste') &&
    (queryLower.includes('étranger') || queryLower.includes('etranger'));
  const isConcert = ['concert', 'spectacle', 'brazzaville'].some(kw => queryLower.includes(kw));

  if (isArtiste && isConcert) {
    logger.info('[HybridSearch] PRIORITY: Artiste étranger → Art. 49');
    const art49Idx = results.findIndex(r => r.payload.numero === '49');
    if (art49Idx > 0) {
      const art49 = results[art49Idx];
      art49.priority = 0;
      results.splice(art49Idx, 1);
      results.unshift(art49);
    }
  }

  return results;
}

/**
 * Force un article en position 1 avec boost
 */
async function forceArticleFirst(
  articleNumber: string,
  results: SearchResult[],
  collectionName: string,
  version: CGIVersion,
  boost: number
): Promise<SearchResult[]> {
  const normalizedNum = articleNumber.replace(/^Art\.\s*/i, '');

  const existingIdx = results.findIndex(r => {
    const resultNum = r.payload.numero.replace(/^Art\.\s*/i, '');
    return resultNum === normalizedNum;
  });

  if (existingIdx >= 0) {
    const article = results[existingIdx];
    article.priority = 0;
    article.score = article.score * boost;
    article.matchType = 'keyword';
    results.splice(existingIdx, 1);
    results.unshift(article);
    logger.info(`[HybridSearch] FORCED: ${articleNumber} moved to position 1 (boost ${boost}x)`);
  } else {
    try {
      const searchResults = await searchByArticleNumbers([articleNumber], collectionName, version);
      if (searchResults.length > 0) {
        const article = searchResults[0];
        article.priority = 0;
        article.score = boost;
        article.matchType = 'keyword';
        results.unshift(article);
        logger.info(`[HybridSearch] FORCED: ${articleNumber} fetched and added at position 1`);
      }
    } catch (error) {
      logger.error(`[HybridSearch] Error fetching forced article ${articleNumber}:`, error);
    }
  }

  return results;
}

/**
 * Recherche hybride : keyword + vectorielle avec priorisation intelligente
 */
export async function hybridSearch(
  query: string,
  limit = 8,
  version: CGIVersion = '2026'
): Promise<SearchResult[]> {
  // Auto-détection : si la question est sociale, chercher dans social_2026
  const isSocial = version === 'social' || isSocialQuery(query);
  const effectiveVersion = isSocial ? 'social' : version;
  const collectionName = CGI_COLLECTIONS[effectiveVersion] || CGI_COLLECTIONS['2026'];
  logger.info(`[HybridSearch] Query: "${query.substring(0, 50)}..." (collection: ${collectionName}, social: ${isSocial})`);

  // ÉTAPE 0: ROUTAGE DIRECT
  let forcedArticle: string | null = null;
  let forcedBoost = 3.0;

  forcedArticle = checkDirectMappings(query);

  if (!forcedArticle) {
    const routingResult = applyRoutingRules(query);
    if (routingResult) {
      forcedArticle = routingResult.article;
      forcedBoost = routingResult.boost;
    }
  }

  // ÉTAPE 1: RECHERCHE PAR KEYWORDS
  const keywordArticles = extractKeywordMatches(query, version);
  logger.info(`[HybridSearch] Keywords matched: ${keywordArticles.length > 0 ? keywordArticles.slice(0, 5).join(', ') : 'aucun'}`);

  const keywordResults = await searchByArticleNumbers(keywordArticles, collectionName, version);
  logger.info(`[HybridSearch] Keyword results: ${keywordResults.length}`);

  // ÉTAPE 2: RECHERCHE VECTORIELLE
  const vectorLimit = Math.max(limit, limit - keywordResults.length + 3);
  const vectorResults = await searchByVector(query, vectorLimit, collectionName, version);
  logger.info(`[HybridSearch] Vector results: ${vectorResults.length}`);

  // ÉTAPE 3: FUSION
  let merged = mergeResults(keywordResults, vectorResults, limit);

  // ÉTAPE 4: ROUTAGE FORCÉ
  if (forcedArticle) {
    merged = await forceArticleFirst(forcedArticle, merged, collectionName, version, forcedBoost);
  }

  // ÉTAPE 5: RÈGLES DE PRIORITÉ
  merged = applyPriorityRules(query, merged);

  logger.info(
    `[HybridSearch] Final: ${merged.map((r) => `${r.payload.numero}(P${r.priority},${r.matchType})`).join(', ')}`
  );

  return merged;
}

export default { hybridSearch };
