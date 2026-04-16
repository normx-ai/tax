// server/src/services/rag/qdrant.service.ts
// Client Qdrant adapté de cgi-engine (1024 dims Voyage, cache in-memory)

import { QdrantClient } from '@qdrant/js-client-rest';
import { createLogger } from '../../utils/logger';
import { cacheService, CACHE_TTL, CACHE_PREFIX, hashText } from '../../utils/cache';
import { VECTOR_SIZE } from './embeddings.service';

const logger = createLogger('QdrantService');

const COLLECTION_NAME = 'cgi_2026';
export const SOCIAL_COLLECTION_NAME = 'social_2026';

let client: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!client) {
    client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });
  }
  return client;
}

export interface ArticleVector {
  id: string;
  vector: number[];
  payload: {
    articleId: string;
    numero: string;
    titre?: string;
    contenu: string;
    tome?: string;
    chapitre?: string;
    version?: string;
    keywords: string[];
    // true si l'article provient d'une instruction d'application
    // de la Loi de Finances (doctrine administrative DGID/DRC).
    isInstruction?: boolean;
    // Nom du document source (ex: "Instruction d'application LF 2026 - IBA")
    sourceDocument?: string;
  };
}

/**
 * Initialise une collection Qdrant (CGI ou Social)
 */
export async function initializeCollection(collectionName: string = COLLECTION_NAME): Promise<void> {
  const qdrant = getQdrantClient();

  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === collectionName);

    if (!exists) {
      await qdrant.createCollection(collectionName, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });
      logger.info(`Collection ${collectionName} créée (${VECTOR_SIZE} dims)`);
    } else {
      logger.info(`Collection ${collectionName} existe déjà`);
    }
  } catch (error) {
    logger.warn(`Qdrant non disponible au démarrage: ${error}`);
  }
}

/**
 * Initialise les deux collections (CGI + Social)
 */
export async function initializeAllCollections(): Promise<void> {
  await initializeCollection(COLLECTION_NAME);
  await initializeCollection(SOCIAL_COLLECTION_NAME);
}

/**
 * Insère un vecteur d'article
 */
export async function upsertArticleVector(article: ArticleVector): Promise<void> {
  const qdrant = getQdrantClient();

  await qdrant.upsert(COLLECTION_NAME, {
    points: [
      {
        id: article.id,
        vector: article.vector,
        payload: article.payload,
      },
    ],
  });
}

/**
 * Insère plusieurs vecteurs d'articles dans une collection
 */
export async function upsertArticleVectors(articles: ArticleVector[], collectionName: string = COLLECTION_NAME): Promise<void> {
  const qdrant = getQdrantClient();
  const BATCH_SIZE = 100;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);

    await qdrant.upsert(collectionName, {
      points: batch.map(article => ({
        id: article.id,
        vector: article.vector,
        payload: article.payload,
      })),
    });

    logger.info(`Batch ${Math.floor(i / BATCH_SIZE) + 1} inséré`);
  }
}

export interface SearchResult {
  id: string;
  score: number;
  payload: ArticleVector['payload'];
}

const SCORE_THRESHOLD = 0.7;

/**
 * Recherche les articles similaires (avec cache in-memory)
 */
export async function searchSimilarArticles(
  queryVector: number[],
  limit: number = 5,
  scoreThreshold: number = SCORE_THRESHOLD,
  version: string = '2026'
): Promise<SearchResult[]> {
  const vectorHash = hashText(queryVector.slice(0, 10).join(','));
  const cacheKey = `${CACHE_PREFIX.SEARCH}${vectorHash}:${limit}:${version}`;

  const cached = cacheService.get<SearchResult[]>(cacheKey);
  if (cached) {
    logger.debug(`Search cache HIT for vector hash: ${vectorHash}`);
    return cached;
  }

  const qdrant = getQdrantClient();
  const startTime = Date.now();

  const collectionToSearch = version === 'social' ? SOCIAL_COLLECTION_NAME : COLLECTION_NAME;
  const results = await qdrant.search(collectionToSearch, {
    vector: queryVector,
    limit,
    with_payload: true,
    with_vector: false,
    score_threshold: scoreThreshold,
    filter: {
      must: [{ key: 'version', match: { value: version } }],
    },
  });

  const searchDuration = Date.now() - startTime;

  if (searchDuration > 500) {
    logger.warn(`Qdrant search slow: ${searchDuration}ms (${results.length} results)`);
  } else {
    logger.info(`Qdrant search: ${searchDuration}ms (${results.length} results, threshold: ${scoreThreshold})`);
  }

  const searchResults = results.map(result => ({
    id: String(result.id),
    score: result.score,
    payload: result.payload as ArticleVector['payload'],
  }));

  cacheService.set(cacheKey, searchResults, CACHE_TTL.SEARCH_RESULT);

  return searchResults;
}

/**
 * Supprime et recrée la collection
 */
export async function clearCollection(): Promise<void> {
  const qdrant = getQdrantClient();

  await qdrant.deleteCollection(COLLECTION_NAME);
  await initializeCollection();
  logger.info('Collection réinitialisée');
}

export default {
  getQdrantClient,
  initializeCollection,
  upsertArticleVector,
  upsertArticleVectors,
  searchSimilarArticles,
  clearCollection,
};
