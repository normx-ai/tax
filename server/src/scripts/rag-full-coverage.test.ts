/**
 * RAG Full Coverage Test — verifie que CHAQUE article du data file est
 * retrouvable via son titre dans le top-K du hybridSearch.
 *
 * Usage : npm run test:rag:full
 * Sample : SAMPLE_RATE=10 (1 article sur 10) par defaut. Override via
 *          SAMPLE_RATE=1 pour tout tester (lent et couteux).
 *
 * Au lieu de tester 75 questions canoniques, ce script parcourt les
 * ~2 371 articles des data files (tome1, tome2, tfnc, conventions,
 * annexes) et pour chacun verifie que l'article correspondant est dans
 * les top 25 resultats quand on utilise son propre titre comme requete.
 *
 * Donne un taux de couverture brut de l'index Qdrant.
 */

import 'dotenv/config';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { hybridSearch } from '../services/rag/hybrid-search.service';

interface ArticleData {
  numero?: string;
  article?: string;
  titre?: string;
}

interface CoverageResult {
  source: string;
  numero: string;
  titre: string;
  found: boolean;
  position: number | null;
}

function normalizeArt(s: string): string {
  return s
    .toLowerCase()
    .replace(/^art\.?\s*/, '')
    .replace(/[\s-]+/g, '')
    .trim();
}

function loadArticles(): { source: string; numero: string; titre: string }[] {
  const dataDir = join(__dirname, '..', '..', 'data');
  const files = readdirSync(dataDir).filter((f) => f.startsWith('articles-2026-') && f.endsWith('.json'));
  const all: { source: string; numero: string; titre: string }[] = [];

  for (const f of files) {
    const content = JSON.parse(readFileSync(join(dataDir, f), 'utf-8'));
    const items: ArticleData[] = Array.isArray(content) ? content : content.articles || [];
    for (const item of items) {
      const numero = item.numero || item.article || '';
      const titre = item.titre || '';
      if (numero && titre && titre.length > 5) {
        all.push({ source: f, numero, titre });
      }
    }
  }

  return all;
}

async function runFullCoverage() {
  const sampleRate = parseInt(process.env.SAMPLE_RATE || '10', 10);
  const articles = loadArticles();
  console.log(`\n========== RAG Full Coverage Test ==========`);
  console.log(`Articles charges : ${articles.length}`);
  console.log(`Sample rate : 1 sur ${sampleRate} (override: SAMPLE_RATE=N)`);

  const sampled = articles.filter((_, i) => i % sampleRate === 0);
  console.log(`Articles testes : ${sampled.length}`);
  console.log(`============================================\n`);

  const results: CoverageResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < sampled.length; i++) {
    const a = sampled[i];
    const question = a.titre;
    process.stdout.write(`[${i + 1}/${sampled.length}] ${a.numero.padEnd(15)} ${a.titre.substring(0, 50)}... `);

    try {
      const searchResults = await hybridSearch(question, 25, '2026');
      const idx = searchResults.findIndex((r) => normalizeArt(r.payload.numero) === normalizeArt(a.numero));
      if (idx >= 0) {
        results.push({ source: a.source, numero: a.numero, titre: a.titre, found: true, position: idx + 1 });
        console.log(`PASS (#${idx + 1})`);
      } else {
        results.push({ source: a.source, numero: a.numero, titre: a.titre, found: false, position: null });
        console.log(`FAIL`);
      }
    } catch (err) {
      console.log(`ERROR (${err instanceof Error ? err.message : String(err)})`);
      results.push({ source: a.source, numero: a.numero, titre: a.titre, found: false, position: null });
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const passed = results.filter((r) => r.found).length;
  const failed = results.length - passed;

  console.log(`\n========== Resultats ==========`);
  console.log(`PASS : ${passed}/${results.length}`);
  console.log(`FAIL : ${failed}/${results.length}`);
  console.log(`Couverture : ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log(`Temps : ${elapsed}s`);

  // Stats par source
  console.log(`\n========== Par source ==========`);
  const bySources = new Map<string, { pass: number; fail: number }>();
  for (const r of results) {
    if (!bySources.has(r.source)) bySources.set(r.source, { pass: 0, fail: 0 });
    const s = bySources.get(r.source)!;
    if (r.found) s.pass++;
    else s.fail++;
  }
  for (const [source, stats] of bySources) {
    const total = stats.pass + stats.fail;
    const pct = ((stats.pass / total) * 100).toFixed(1);
    console.log(`  ${source.padEnd(35)} ${stats.pass.toString().padStart(4)}/${total.toString().padStart(4)} (${pct}%)`);
  }

  // Distribution des positions
  const byPosition = { top1: 0, top5: 0, top10: 0, top25: 0 };
  for (const r of results) {
    if (r.position === null) continue;
    if (r.position === 1) byPosition.top1++;
    if (r.position <= 5) byPosition.top5++;
    if (r.position <= 10) byPosition.top10++;
    if (r.position <= 25) byPosition.top25++;
  }
  console.log(`\n========== Distribution position (% sur testes) ==========`);
  console.log(`  Top 1  : ${byPosition.top1.toString().padStart(4)} (${((byPosition.top1 / results.length) * 100).toFixed(1)}%)`);
  console.log(`  Top 5  : ${byPosition.top5.toString().padStart(4)} (${((byPosition.top5 / results.length) * 100).toFixed(1)}%)`);
  console.log(`  Top 10 : ${byPosition.top10.toString().padStart(4)} (${((byPosition.top10 / results.length) * 100).toFixed(1)}%)`);
  console.log(`  Top 25 : ${byPosition.top25.toString().padStart(4)} (${((byPosition.top25 / results.length) * 100).toFixed(1)}%)`);

  if (failed > 0 && failed <= 30) {
    console.log(`\n========== Articles perdus ==========`);
    for (const r of results.filter((x) => !x.found)) {
      console.log(`  ${r.numero.padEnd(15)} ${r.titre.substring(0, 70)}`);
    }
  } else if (failed > 30) {
    console.log(`\n========== 30 premiers articles perdus ==========`);
    for (const r of results.filter((x) => !x.found).slice(0, 30)) {
      console.log(`  ${r.numero.padEnd(15)} ${r.titre.substring(0, 70)}`);
    }
    console.log(`  ... et ${failed - 30} autres`);
  }
  console.log();

  process.exit(failed > 0 ? 1 : 0);
}

runFullCoverage().catch((err) => {
  console.error('Erreur fatale:', err);
  process.exit(2);
});
