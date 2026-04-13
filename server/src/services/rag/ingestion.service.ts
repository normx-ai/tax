// server/src/services/rag/ingestion.service.ts
// Pipeline d'ingestion: JSON -> PostgreSQL + Qdrant
// Adapté de cgi-engine (sans Redis, sans uuid externe, Prisma direct)

import { generateEmbeddings } from './embeddings.service';
import { initializeCollection, upsertArticleVectors, ArticleVector } from './qdrant.service';
import { createLogger } from '../../utils/logger';
import prisma from '../../utils/prisma';
import crypto from 'crypto';
import {
  ArticleJSON,
  SourceFile,
  transformSourceToArticles,
  prepareArticleText,
  isMeaningfulArticle,
} from './ingestion.parsers';

export type { ArticleJSON, SourceFile } from './ingestion.parsers';

const logger = createLogger('IngestionService');

export interface IngestionResult {
  total: number;
  inserted: number;
  updated: number;
  errors: number;
  tokensUsed: number;
}

export async function ingestFromSource(sources: SourceFile[]): Promise<IngestionResult> {
  const allArticles: ArticleJSON[] = [];
  for (const source of sources) {
    allArticles.push(...transformSourceToArticles(source));
  }
  return ingestArticles(allArticles);
}

export async function ingestArticles(articles: ArticleJSON[]): Promise<IngestionResult> {
  // Filtrer les articles vides (Abroge, Sans objet, contenu < 30 chars)
  // pour ne pas polluer le RAG avec des articles non-trouvables.
  const totalRaw = articles.length;
  const filtered = articles.filter(isMeaningfulArticle);
  const skipped = totalRaw - filtered.length;
  if (skipped > 0) {
    logger.info(`Filtre articles vides : ${skipped}/${totalRaw} ignores (Abroge, Sans objet, contenu < 30 chars)`);
  }

  const result: IngestionResult = {
    total: filtered.length,
    inserted: 0,
    updated: 0,
    errors: 0,
    tokensUsed: 0,
  };

  articles = filtered;
  await initializeCollection();
  logger.info(`Début ingestion de ${articles.length} articles`);

  const BATCH_SIZE = 20;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const texts = batch.map(prepareArticleText);

    try {
      const embeddings = await generateEmbeddings(texts);
      const vectors: ArticleVector[] = [];

      for (let j = 0; j < batch.length; j++) {
        const article = batch[j];
        const embedding = embeddings[j];
        result.tokensUsed += embedding.tokensUsed;

        try {
          const version = article.version || '2026';
          const tome = article.tome || '1';
          const livre = article.livre || '';

          // Chercher si l'article existe déjà
          const existing = await prisma.article.findFirst({
            where: {
              numero: article.numero,
              version: version,
            },
          });

          const articleData = {
            numero: article.numero,
            titre: article.titre,
            contenu: article.contenu,
            tome: tome,
            version: version,
            keywords: article.keywords || [],
          };

          let dbArticle;
          if (existing) {
            dbArticle = await prisma.article.update({
              where: { id: existing.id },
              data: articleData,
            });
            result.updated++;
          } else {
            dbArticle = await prisma.article.create({ data: articleData });
            result.inserted++;
          }

          vectors.push({
            id: crypto.randomUUID(),
            vector: embedding.embedding,
            payload: {
              articleId: dbArticle.id,
              numero: article.numero,
              titre: article.titre,
              contenu: article.contenu.substring(0, 1000),
              tome: article.tome,
              chapitre: article.chapitre,
              version: version,
              keywords: article.keywords || [],
            },
          });
        } catch (err) {
          logger.error(`Erreur article ${article.numero}:`, err);
          result.errors++;
        }
      }

      if (vectors.length > 0) {
        await upsertArticleVectors(vectors);
      }

      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(articles.length / BATCH_SIZE);
      logger.info(`Batch ${batchNum}/${totalBatches} traité (${result.inserted} insérés, ${result.updated} mis à jour, ${result.errors} erreurs)`);
    } catch (err) {
      logger.error('Erreur batch embeddings:', err);
      result.errors += batch.length;
    }
  }

  logger.info(`Ingestion terminée: ${result.inserted} insérés, ${result.updated} mis à jour, ${result.errors} erreurs`);

  // 2ème passe : extraction des références croisées entre articles
  await extractArticleReferences();

  return result;
}

// ==================== EXTRACTION REFERENCES CROISEES ====================

const ARTICLE_REF_PATTERNS = [
  /Art\.\s*(\d+(?:\s*[A-Z](?:is)?)?)/gi,                       // Art. 86A, Art. 86Abis
  /articles?\s+(\d+(?:\s*[a-z]+)?)/gi,                          // article 12, articles 1er
  /(?:visé|prévu|mentionné).*?art(?:icle)?\.?\s*(\d+[A-Z]?)/gi, // visé à l'art. 86
];

/**
 * Extrait les numéros d'articles référencés dans un texte
 */
function extractReferencedNumeros(text: string): string[] {
  const numeros = new Set<string>();

  for (const pattern of ARTICLE_REF_PATTERNS) {
    // Reset lastIndex pour chaque usage (flag 'g')
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const numero = match[1].trim().replace(/\s+/g, '');
      numeros.add(numero);
    }
  }

  return Array.from(numeros);
}

/**
 * Scanne tous les articles en BDD et crée les ArticleReference
 * pour les références croisées détectées dans le contenu.
 */
async function extractArticleReferences(): Promise<void> {
  logger.info('Extraction des références croisées entre articles...');

  const articles = await prisma.article.findMany({
    select: { id: true, numero: true, contenu: true, version: true },
  });

  // Index par numéro pour lookup rapide
  const articlesByNumero = new Map<string, string>();
  for (const article of articles) {
    articlesByNumero.set(article.numero, article.id);
  }

  let refsCreated = 0;

  for (const article of articles) {
    const referencedNumeros = extractReferencedNumeros(article.contenu);

    for (const numero of referencedNumeros) {
      // Ne pas créer d'auto-référence
      if (numero === article.numero) continue;

      const targetId = articlesByNumero.get(numero);
      if (!targetId) continue;

      try {
        await prisma.articleReference.upsert({
          where: {
            fromArticleId_toArticleId: {
              fromArticleId: article.id,
              toArticleId: targetId,
            },
          },
          create: {
            fromArticleId: article.id,
            toArticleId: targetId,
          },
          update: {},
        });
        refsCreated++;
      } catch (err) {
        logger.warn(`Erreur création ref ${article.numero} -> ${numero}:`, err);
      }
    }
  }

  logger.info(`Références croisées: ${refsCreated} relations créées/vérifiées`);
}

export default { ingestArticles, ingestFromSource };
