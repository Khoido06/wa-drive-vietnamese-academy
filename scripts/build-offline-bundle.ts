#!/usr/bin/env node
/**
 * Build offline exam bundle (40 questions from set-01) for PWA service worker.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const setPath = resolve(root, "packages/learning-engine/data/wa/set-01.json");
const outDir = resolve(root, "apps/web/public/offline");
const outPath = resolve(outDir, "exam-wa-set-01.json");

interface Q {
  externalId: string;
  topic: string;
  questionTextVi: string;
  imageUrl?: string;
  options: Array<{ id: string; textVi: string }>;
  correctOptionId: string;
  explanationVi: string;
}

const all = JSON.parse(readFileSync(setPath, "utf8")) as Q[];
const examLength = 40;
const questions = all.slice(0, examLength).map((q) => ({
  id: q.externalId,
  topic: q.topic,
  questionTextVi: q.questionTextVi,
  imageUrl: q.imageUrl ?? null,
  options: q.options.map((o) => ({ id: o.id, textVi: o.textVi })),
  correctOptionId: q.correctOptionId,
  explanationVi: q.explanationVi,
}));

const bundle = {
  version: 1,
  setId: "wa-set-01",
  setName: "Bộ đề 1",
  examLength,
  passCount: 32,
  generatedAt: new Date().toISOString(),
  questions,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(bundle, null, 2));
console.log(`✅ Offline bundle: ${questions.length} questions → ${outPath}`);
