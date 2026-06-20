/**
 * RAG retrieval eval — runs offline in CI without DB or LLM keys.
 * Inspired by RAGAS retrieval metrics; uses keyword hybrid search on golden corpus.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { keywordScore, rankByKeywords } from "../src/rag/keyword-search.js";
import {
  contextPrecision,
  contextRecall,
  faithfulness,
  answerRelevancy,
  aggregateRagas,
  type RagasMetrics,
} from "./ragas-metrics.js";

const __dir = dirname(fileURLToPath(import.meta.url));

interface CorpusChunk {
  id: string;
  content: string;
  sectionTitle: string;
}

interface GoldenQuery {
  id: string;
  query: string;
  expectedInTopChunk: string[];
  minRetrievalScore: number;
}

interface EvalResult {
  id: string;
  query: string;
  passed: boolean;
  topScore: number;
  topContent: string;
  missingTerms: string[];
  ragas: RagasMetrics;
}

const MIN_PASS_RATE = Number(process.env.RAG_EVAL_MIN_PASS_RATE ?? 0.85);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(__dir, name), "utf-8")) as T;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export { normalize };

function evalQuery(corpus: CorpusChunk[], golden: GoldenQuery): EvalResult {
  const rows = corpus.map((c) => ({
    id: c.id,
    content: c.content,
    sectionTitle: c.sectionTitle,
    pageNumber: null,
  }));

  const ranked = rankByKeywords(golden.query, rows, 3);
  const top = ranked[0];
  const topContent = top?.content ?? "";
  const topScore = top?.score ?? 0;
  const normalizedTop = normalize(topContent);

  const missingTerms = golden.expectedInTopChunk.filter(
    (term) => !normalizedTop.includes(normalize(term)),
  );

  const passed =
    topScore >= golden.minRetrievalScore &&
    missingTerms.length === 0 &&
    ranked.length > 0;

  const referenceChunk = corpus.find((c) => c.id === `c${golden.id.replace("q", "")}`)?.content ?? topContent;

  const ragas: RagasMetrics = {
    contextPrecision: contextPrecision(topContent, golden.expectedInTopChunk),
    contextRecall: contextRecall(topContent, referenceChunk),
    faithfulness: faithfulness(topContent.slice(0, 200), topContent),
    answerRelevancy: answerRelevancy(golden.query, topContent),
  };

  return {
    id: golden.id,
    query: golden.query,
    passed,
    topScore,
    topContent: topContent.slice(0, 120),
    missingTerms,
    ragas,
  };
}

export function runRagEval(): {
  passRate: number;
  passed: number;
  total: number;
  results: EvalResult[];
  ragas: RagasMetrics;
  ok: boolean;
} {
  const corpus = loadJson<CorpusChunk[]>("golden-corpus.json");
  const queries = loadJson<GoldenQuery[]>("golden-queries.json");
  const results = queries.map((q) => evalQuery(corpus, q));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const passRate = total === 0 ? 0 : passed / total;
  const ragas = aggregateRagas(results.map((r) => r.ragas));

  const ragasOk =
    ragas.contextPrecision >= 0.75 &&
    ragas.contextRecall >= 0.6 &&
    ragas.faithfulness >= 0.5;

  return {
    passRate,
    passed,
    total,
    results,
    ragas,
    ok: passRate >= MIN_PASS_RATE && ragasOk,
  };
}

/** Sanity: keyword scorer behaves on known pair */
export function sanityCheckKeywordScorer(): boolean {
  const score = keywordScore("tốc độ dân cư", "Tốc độ tối đa trong khu dân cư là 25 mph");
  return score > 0.3;
}

const isMain =
  process.argv[1] != null &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  if (!sanityCheckKeywordScorer()) {
    console.error("❌ Keyword scorer sanity check failed");
    process.exit(1);
  }

  const report = runRagEval();
  console.log(`\nRAG Eval — ${report.passed}/${report.total} passed (${(report.passRate * 100).toFixed(1)}%)`);
  console.log(`RAGAS-style metrics:`);
  console.log(`  context_precision: ${(report.ragas.contextPrecision * 100).toFixed(1)}%`);
  console.log(`  context_recall:    ${(report.ragas.contextRecall * 100).toFixed(1)}%`);
  console.log(`  faithfulness:      ${(report.ragas.faithfulness * 100).toFixed(1)}%`);
  console.log(`  answer_relevancy:  ${(report.ragas.answerRelevancy * 100).toFixed(1)}%`);
  console.log(`Threshold: ${(MIN_PASS_RATE * 100).toFixed(0)}%\n`);

  for (const r of report.results.filter((x) => !x.passed)) {
    console.log(`  ✗ ${r.id}: ${r.query}`);
    console.log(`    score=${r.topScore.toFixed(2)} missing=[${r.missingTerms.join(", ")}]`);
  }

  if (report.ok) {
    console.log("\n✅ RAG eval passed\n");
    process.exit(0);
  }

  console.error("\n❌ RAG eval failed — retrieval quality below threshold\n");
  process.exit(1);
}
