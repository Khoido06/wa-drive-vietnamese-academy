import type { RagChunk } from "../types.js";

/** Rough token estimate — conservative for Vietnamese + English mixed text. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

/** Groq on_demand free tier caps input at ~6000 tokens per request. */
export function groqPromptTokenBudget(): number {
  return Number(process.env.GROQ_MAX_PROMPT_TOKENS ?? 5500);
}

export function buildContextWithinBudget(
  chunks: RagChunk[],
  systemPrompt: string,
  query: string,
  maxTokens: number,
): string {
  const overhead = estimateTokens(systemPrompt) + estimateTokens(query) + 80;
  let budget = maxTokens - overhead;
  const parts: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    if (budget <= 0) break;
    const prefix = `[${i + 1}] `;
    const maxChars = Math.max(120, Math.floor(budget * 3) - prefix.length);
    const content = chunks[i]!.content;
    const trimmed =
      content.length > maxChars ? `${content.slice(0, maxChars).trimEnd()}…` : content;
    parts.push(`${prefix}${trimmed}`);
    budget -= estimateTokens(`${prefix}${trimmed}\n\n`);
  }

  return parts.join("\n\n");
}
