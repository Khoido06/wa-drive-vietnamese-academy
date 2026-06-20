#!/usr/bin/env node
/**
 * Generate golden-corpus.json + golden-queries.json (50+) from WA curated exam bank.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = resolve(root, "packages/learning-engine/data/wa");
const evalDir = resolve(root, "packages/ai-core/eval");

interface CuratedQ {
  externalId: string;
  topic: string;
  questionTextVi: string;
  options: Array<{ id: string; textVi: string }>;
  correctOptionId: string;
  explanationVi: string;
}

const files = readdirSync(dataDir).filter((f) => f.startsWith("set-") && f.endsWith(".json"));
const all: CuratedQ[] = [];
for (const f of files) {
  all.push(...(JSON.parse(readFileSync(resolve(dataDir, f), "utf8")) as CuratedQ[]));
}

// Pick up to 50 diverse questions (one per topic round-robin)
const byTopic = new Map<string, CuratedQ[]>();
for (const q of all) {
  const list = byTopic.get(q.topic) ?? [];
  list.push(q);
  byTopic.set(q.topic, list);
}

const picked: CuratedQ[] = [];
const topics = [...byTopic.keys()];
let round = 0;
while (picked.length < 50 && round < 10) {
  for (const topic of topics) {
    const list = byTopic.get(topic)!;
    const item = list[round];
    if (item && picked.length < 50) picked.push(item);
  }
  round++;
}

const corpus = picked.map((q, i) => ({
  id: `c${i + 1}`,
  content: `${q.questionTextVi} ${q.explanationVi}`,
  sectionTitle: q.topic,
}));

function extractTerms(q: CuratedQ): string[] {
  const content = normalize(`${q.questionTextVi} ${q.explanationVi}`);
  const correct = q.options.find((o) => o.id === q.correctOptionId);
  const candidates: string[] = [];

  if (correct) {
    const nums = correct.textVi.match(/\d+(?:\.\d+)?%?/g) ?? [];
    candidates.push(...nums);
    const words = correct.textVi.match(/[A-Za-zÀ-ỹ]{3,}/g) ?? [];
    candidates.push(...words.slice(0, 2));
  }

  const explWords = q.explanationVi.match(/\d+(?:\.\d+)?%?|[A-Za-zÀ-ỹ]{4,}/g) ?? [];
  candidates.push(...explWords.slice(0, 4));

  const terms = candidates
    .map((t) => t.toLowerCase())
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .filter((t) => content.includes(normalize(t)));

  if (terms.length === 0) terms.push(q.topic.replace(/_/g, " "));
  return terms.slice(0, 3);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const queries = picked.map((q, i) => ({
  id: `q${i + 1}`,
  query: q.questionTextVi.length > 120 ? q.questionTextVi.slice(0, 120) + "?" : q.questionTextVi,
  expectedInTopChunk: extractTerms(q),
  minRetrievalScore: 0.15,
  topic: q.topic,
}));

writeFileSync(resolve(evalDir, "golden-corpus.json"), JSON.stringify(corpus, null, 2) + "\n");
writeFileSync(resolve(evalDir, "golden-queries.json"), JSON.stringify(queries, null, 2) + "\n");
console.log(`✅ Generated ${corpus.length} corpus chunks + ${queries.length} golden queries`);
