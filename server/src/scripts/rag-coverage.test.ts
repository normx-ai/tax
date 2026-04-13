/**
 * RAG Coverage Test — verifie que les questions canoniques retrouvent
 * bien l'article attendu dans les top-K resultats du hybridSearch.
 *
 * Usage : npm run test:rag
 *
 * Pour chaque question avec un `expected` non vide, on appelle hybridSearch
 * et on verifie que TOUS les articles attendus apparaissent dans les top
 * resultats. On reporte PASS/FAIL et la position de chaque article.
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { hybridSearch } from '../services/rag/hybrid-search.service';

interface TestCase {
  question: string;
  expected: string[];
  agent?: string;
  _note?: string;
}

interface TestResult {
  question: string;
  agent?: string;
  expected: string[];
  found: { numero: string; position: number; score: number }[];
  missing: string[];
  passed: boolean;
}

function normalizeArt(s: string): string {
  return s
    .toLowerCase()
    .replace(/^art\.?\s*/, '')
    .replace(/[\s-]+/g, '')   // retirer espaces ET tirets : "110-A", "110 A", "110A" matchent
    .trim();
}

function articleMatches(found: string, expected: string): boolean {
  return normalizeArt(found) === normalizeArt(expected);
}

async function runTests() {
  const casesPath = join(__dirname, 'rag-coverage-cases.json');
  const cases: TestCase[] = JSON.parse(readFileSync(casesPath, 'utf-8'));

  const testable = cases.filter((c) => c.expected && c.expected.length > 0);
  const skipped = cases.length - testable.length;

  console.log(`\n========== RAG Coverage Test ==========`);
  console.log(`Total cases: ${cases.length}`);
  console.log(`Testable (avec expected): ${testable.length}`);
  console.log(`Skipped (expected vide): ${skipped}`);
  console.log(`========================================\n`);

  const results: TestResult[] = [];

  for (const tc of testable) {
    process.stdout.write(`[${results.length + 1}/${testable.length}] ${tc.question.substring(0, 60)}... `);
    try {
      const searchResults = await hybridSearch(tc.question, 25, '2026');
      const foundArticles = searchResults.map((r, i) => ({
        numero: r.payload.numero,
        position: i + 1,
        score: r.score,
      }));
      const missing = tc.expected.filter(
        (exp) => !foundArticles.some((f) => articleMatches(f.numero, exp))
      );
      const passed = missing.length === 0;
      results.push({
        question: tc.question,
        agent: tc.agent,
        expected: tc.expected,
        found: foundArticles,
        missing,
        passed,
      });
      console.log(passed ? 'PASS' : `FAIL (manque: ${missing.join(', ')})`);
    } catch (err) {
      console.log(`ERROR (${err instanceof Error ? err.message : String(err)})`);
      results.push({
        question: tc.question,
        agent: tc.agent,
        expected: tc.expected,
        found: [],
        missing: tc.expected,
        passed: false,
      });
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`\n========== Resultats ==========`);
  console.log(`PASS : ${passed}/${results.length}`);
  console.log(`FAIL : ${failed}/${results.length}`);

  if (failed > 0) {
    console.log(`\n========== Echecs ==========`);
    for (const r of results.filter((x) => !x.passed)) {
      console.log(`\nQ: ${r.question}`);
      console.log(`  Attendus  : ${r.expected.join(', ')}`);
      console.log(`  Manquants : ${r.missing.join(', ')}`);
      console.log(`  Top 5 trouves :`);
      for (const f of r.found.slice(0, 5)) {
        console.log(`    #${f.position} ${f.numero} (score ${f.score.toFixed(3)})`);
      }
    }
  }

  console.log(`\nTaux de couverture : ${((passed / results.length) * 100).toFixed(1)}%\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Erreur fatale:', err);
  process.exit(2);
});
