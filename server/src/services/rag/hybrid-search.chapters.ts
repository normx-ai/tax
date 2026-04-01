// server/src/services/rag/hybrid-search.chapters.ts
// Fonctions de recherche par chapitre CGI avec factory pattern
// Tous les keywords sont maintenant dans les fichiers 2026

import { KEYWORD_ARTICLE_MAP_2026, SYNONYMS_2026 } from '../../config/keyword-mappings-2026';
import { ARTICLE_METADATA_2026, ArticleMetadata2026 } from '../../config/article-metadata-2026';
import { KEYWORD_ARTICLE_MAP_IBA_2026, SYNONYMS_IBA_2026 } from '../../config/keyword-mappings-iba-2026';
import { ARTICLE_METADATA_IBA_2026, ArticleMetadataIBA2026 } from '../../config/article-metadata-iba-2026';

type KeywordMap = Record<string, string[] | Array<{ article: string }>>;
type SynonymsMap = Record<string, string[]>;

/**
 * Factory générique pour créer des fonctions de recherche par chapitre
 */
function createChapterSearch(
  keywordMap: KeywordMap,
  synonymsMap: SynonymsMap,
  isArrayFormat: boolean = false
): (query: string) => string[] {
  return (query: string): string[] => {
    const normalizedQuery = query.toLowerCase();
    const matchedArticles: string[] = [];
    const seen = new Set<string>();

    // Expansion avec synonymes
    let expandedQuery = normalizedQuery;
    for (const [term, synonyms] of Object.entries(synonymsMap)) {
      for (const synonym of synonyms) {
        if (normalizedQuery.includes(synonym.toLowerCase())) {
          expandedQuery += ` ${term}`;
        }
      }
    }

    // Recherche dans le mapping
    for (const [keyword, articles] of Object.entries(keywordMap)) {
      if (expandedQuery.includes(keyword.toLowerCase())) {
        for (const articleEntry of articles) {
          const article = isArrayFormat && typeof articleEntry === 'object'
            ? (articleEntry as { article: string }).article
            : articleEntry as string;
          if (!seen.has(article)) {
            seen.add(article);
            matchedArticles.push(article);
          }
        }
      }
    }

    return matchedArticles;
  };
}

// Fonctions de recherche par chapitre
export const findArticlesForQuery2026 = createChapterSearch(KEYWORD_ARTICLE_MAP_2026, SYNONYMS_2026);
export const findArticlesForQueryIBA2026 = createChapterSearch(KEYWORD_ARTICLE_MAP_IBA_2026, SYNONYMS_IBA_2026);

// Ré-export pour compatibilité (utilise maintenant le mapping 2026 unifié)
export const findArticlesForQuery = findArticlesForQuery2026;

// Types de métadonnées exportés
export type AnyArticleMetadata =
  | ArticleMetadata2026
  | ArticleMetadataIBA2026;

/**
 * Normalise le numéro d'article
 */
function normalizeArticleNumber(numero: string): string {
  return numero.replace(/^Art\.\s*/i, 'Art. ');
}

/**
 * Obtient les métadonnées d'un article pour CGI 2026
 */
export function getArticleMetadata2026(numero: string): ArticleMetadata2026 | undefined {
  const normalized = normalizeArticleNumber(numero);
  return ARTICLE_METADATA_2026[normalized] || ARTICLE_METADATA_2026[numero];
}

/**
 * Obtient les métadonnées d'un article pour CGI 2026 IBA
 */
export function getArticleMetadataIBA2026(numero: string): ArticleMetadataIBA2026 | undefined {
  const normalized = normalizeArticleNumber(numero);
  return ARTICLE_METADATA_IBA_2026[normalized] || ARTICLE_METADATA_IBA_2026[numero];
}

export interface MetadataResult {
  priority: number;
  articleType?: string;
}

/**
 * Récupère les métadonnées d'un article selon la version
 */
export function getMetadataForArticle(numero: string, version: '2025' | '2026' | 'current' | 'social'): MetadataResult {
  const numWithPrefix = numero.startsWith('Art.') ? numero : `Art. ${numero}`;

  // Pour le Code Social, retourner des métadonnées par défaut (pas de mapping détaillé pour l'instant)
  if (version === 'social') {
    return { priority: 1, articleType: 'social' };
  }

  // Toutes les versions utilisent maintenant les métadonnées 2026
  const metadataIS = getArticleMetadata2026(numWithPrefix) || getArticleMetadata2026(numero);
  const metadataIBA = getArticleMetadataIBA2026(numWithPrefix) || getArticleMetadataIBA2026(numero);
  const metadata = metadataIS || metadataIBA;
  return {
    priority: metadata?.priority || 2,
    articleType: metadata?.themes?.[0],
  };
}

/**
 * Extrait les articles correspondants via keyword matching
 */
export function extractKeywordMatches(query: string, version: '2025' | '2026' | 'current' | 'social'): string[] {
  const seen = new Set<string>();
  const articles: string[] = [];

  const addUnique = (arts: string[]) => {
    for (const art of arts) {
      if (!seen.has(art)) {
        seen.add(art);
        articles.push(art);
      }
    }
  };

  // Pour le Code Social, pas de keyword matching détaillé pour l'instant — la recherche vectorielle suffit
  if (version === 'social') {
    return [];
  }

  // Tous les keywords sont maintenant dans les fichiers 2026 (y compris les anciens articles 2025)
  addUnique(findArticlesForQuery2026(query));
  addUnique(findArticlesForQueryIBA2026(query));

  return articles;
}

export default {
  findArticlesForQuery2026,
  findArticlesForQueryIBA2026,
  getMetadataForArticle,
  extractKeywordMatches,
};
