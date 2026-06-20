import type { RagConfig } from "../../types.js";
import type { LlmProvider } from "./types.js";

const BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

async function ollamaFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Ollama ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

export const ollamaProvider: LlmProvider = {
  name: "ollama",

  async isAvailable() {
    try {
      const res = await fetch(`${BASE_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  async embed(text: string, config: RagConfig) {
    const data = await ollamaFetch<{ embeddings: number[][] }>("/api/embed", {
      model: config.embeddingModel,
      input: text,
    });
    const vec = data.embeddings[0];
    if (!vec) throw new Error("Ollama returned empty embedding");
    return vec;
  },

  async complete(systemPrompt: string, userPrompt: string, config: RagConfig) {
    const data = await ollamaFetch<{ message: { content: string } }>("/api/chat", {
      model: config.generationModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      options: { temperature: 0.1 },
    });
    return data.message.content;
  },

  async completeJSON<T>(systemPrompt: string, userPrompt: string, config: RagConfig) {
    const data = await ollamaFetch<{ message: { content: string } }>("/api/chat", {
      model: config.generationModel,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\n\nRespond with valid JSON only. No markdown fences.`,
        },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      format: "json",
      options: { temperature: 0.2 },
    });
    return JSON.parse(data.message.content) as T;
  },
};
