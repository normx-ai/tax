// server/scripts/ingest-social.ts
// Script d'ingestion des articles du Code Social dans Qdrant (collection social_2026)

import path from 'path';
import fs from 'fs';
import { generateEmbeddings } from '../services/rag/embeddings.service';
import { getQdrantClient, initializeCollection, SOCIAL_COLLECTION_NAME, type ArticleVector } from '../services/rag/qdrant.service';
import crypto from 'crypto';

const SOCIAL_DIR = path.join(__dirname, '..', '..', 'data', 'social', '2026');
const CONVENTIONS_DIR = path.join(SOCIAL_DIR, 'conventions');
const BATCH_SIZE = 20;

interface RawArticle {
  article?: string;
  numero?: string | number;
  titre?: string;
  texte?: string[];
  contenu?: string;
  mots_cles?: string[];
  statut?: string;
  section?: string;
}

interface SourceFile {
  meta: {
    document?: string;
    code?: string;
    partie?: string;
    section?: string;
    chapitre_titre?: string;
    section_titre?: string;
    [key: string]: unknown;
  };
  articles?: RawArticle[];
}

function normalizeArticle(raw: RawArticle, meta: SourceFile['meta']): { numero: string; titre: string; contenu: string; keywords: string[]; section: string } | null {
  const numero = raw.article || (raw.numero ? `Art. ${raw.numero}` : null);
  if (!numero) return null;

  const contenu = raw.texte?.join('\n') || raw.contenu || '';
  if (!contenu) return null;

  return {
    numero: numero.replace(/^Art\.\s*/i, '').trim() || numero,
    titre: raw.titre || '',
    contenu,
    keywords: raw.mots_cles || [],
    section: raw.section || meta.chapitre_titre || meta.section_titre || meta.document || '',
  };
}

function prepareText(article: { numero: string; titre: string; contenu: string; keywords: string[]; section: string }): string {
  const parts: string[] = [];
  parts.push(`Article ${article.numero}`);
  if (article.titre) parts.push(article.titre);
  if (article.section) parts.push(`Section: ${article.section}`);
  parts.push(article.contenu);
  if (article.keywords.length) parts.push(`Mots-clés: ${article.keywords.join(', ')}`);
  return parts.join('\n');
}

async function main() {
  console.log('=== INGESTION CODE SOCIAL → Qdrant (social_2026) ===\n');

  // 1. Collecter tous les fichiers JSON
  const files: string[] = [];

  // Fichiers principaux
  const mainFiles = fs.readdirSync(SOCIAL_DIR).filter(f => f.endsWith('.json') && f !== 'sommaire-travail.json' && f !== 'sommaire-social.json');
  for (const f of mainFiles) {
    files.push(path.join(SOCIAL_DIR, f));
  }

  // Conventions collectives
  if (fs.existsSync(CONVENTIONS_DIR)) {
    const ccFiles = fs.readdirSync(CONVENTIONS_DIR).filter(f => f.endsWith('.json'));
    for (const f of ccFiles) {
      files.push(path.join(CONVENTIONS_DIR, f));
    }
  }

  console.log(`Fichiers trouvés: ${files.length}\n`);

  // 2. Parser tous les articles
  const allArticles: { numero: string; titre: string; contenu: string; keywords: string[]; section: string; source: string }[] = [];

  for (const filePath of files) {
    try {
      const raw: SourceFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (!raw.articles) continue;

      const source = path.basename(filePath, '.json');

      for (const rawArt of raw.articles) {
        const normalized = normalizeArticle(rawArt, raw.meta);
        if (normalized) {
          allArticles.push({ ...normalized, source });
        }
      }
    } catch (err) {
      console.error(`Erreur parsing ${filePath}:`, err);
    }
  }

  console.log(`Articles parsés: ${allArticles.length}\n`);

  // 3. Initialiser la collection Qdrant
  await initializeCollection(SOCIAL_COLLECTION_NAME);

  // Supprimer l'ancienne collection si elle existe pour réingérer proprement
  const qdrant = getQdrantClient();
  try {
    const collections = await qdrant.getCollections();
    if (collections.collections.some(c => c.name === SOCIAL_COLLECTION_NAME)) {
      const info = await qdrant.getCollection(SOCIAL_COLLECTION_NAME);
      if (info.points_count && info.points_count > 0) {
        console.log(`Collection ${SOCIAL_COLLECTION_NAME} existante avec ${info.points_count} points, suppression...`);
        await qdrant.deleteCollection(SOCIAL_COLLECTION_NAME);
        await initializeCollection(SOCIAL_COLLECTION_NAME);
      }
    }
  } catch {
    // Collection n'existe pas encore
  }

  // 4. Générer embeddings et insérer par batch
  let inserted = 0;
  let errors = 0;
  let tokensUsed = 0;

  for (let i = 0; i < allArticles.length; i += BATCH_SIZE) {
    const batch = allArticles.slice(i, i + BATCH_SIZE);
    const texts = batch.map(prepareText);

    try {
      const embeddings = await generateEmbeddings(texts);
      const vectors: ArticleVector[] = [];

      for (let j = 0; j < batch.length; j++) {
        const article = batch[j];
        const embedding = embeddings[j];
        tokensUsed += embedding.tokensUsed;

        vectors.push({
          id: crypto.randomUUID(),
          vector: embedding.embedding,
          payload: {
            articleId: `social-${article.source}-${article.numero}`,
            numero: article.numero,
            titre: article.titre,
            contenu: article.contenu.substring(0, 1000),
            tome: 'social',
            chapitre: article.section,
            version: 'social',
            keywords: article.keywords,
          },
        });
      }

      await qdrant.upsert(SOCIAL_COLLECTION_NAME, {
        points: vectors.map(v => ({
          id: v.id,
          vector: v.vector,
          payload: v.payload,
        })),
      });

      inserted += vectors.length;
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allArticles.length / BATCH_SIZE);
      console.log(`  Batch ${batchNum}/${totalBatches}: ${vectors.length} articles (total: ${inserted})`);
    } catch (err) {
      console.error(`  Erreur batch ${Math.floor(i / BATCH_SIZE) + 1}:`, err);
      errors += batch.length;
    }
  }

  console.log(`\n=== RÉSULTAT ===`);
  console.log(`Articles ingérés: ${inserted}`);
  console.log(`Erreurs: ${errors}`);
  console.log(`Tokens utilisés: ${tokensUsed}`);
  console.log(`Collection: ${SOCIAL_COLLECTION_NAME}`);
}

main().catch(console.error);
