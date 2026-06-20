import type { RagChunk } from "../types.js";

/** Normalize Vietnamese query terms for keyword matching (free — no embed API). */
export function extractQueryTerms(query: string): string[] {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 2);
}

/** Score chunk by keyword overlap — used when no real embedding provider on production. */
export function keywordScore(query: string, content: string): number {
  const terms = extractQueryTerms(query);
  if (terms.length === 0) return 0;

  const normalized = content
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  let hits = 0;
  for (const term of terms) {
    if (normalized.includes(term)) hits++;
  }
  return hits / terms.length;
}

export function rankByKeywords(
  query: string,
  rows: Array<{
    id: string;
    content: string;
    sectionTitle: string | null;
    pageNumber: number | null;
  }>,
  topK: number,
): RagChunk[] {
  return rows
    .map((row) => ({
      id: row.id,
      content: row.content,
      sectionTitle: row.sectionTitle,
      pageNumber: row.pageNumber,
      score: keywordScore(query, row.content),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/** Fast heuristic: is the answer grounded in retrieved chunks? (no extra LLM call) */
export function isAnswerGrounded(answer: string, chunks: RagChunk[], minRatio = 0.25): boolean {
  const words = answer
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4);
  if (words.length === 0) return chunks.length > 0;

  const context = chunks.map((c) => c.content.toLowerCase()).join(" ");
  const matched = words.filter((w) => context.includes(w)).length;
  return matched / words.length >= minRatio || chunks.length === 0;
}
