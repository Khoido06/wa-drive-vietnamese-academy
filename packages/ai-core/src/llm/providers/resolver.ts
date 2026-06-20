import type { AiProvider, LlmProvider } from "./types.js";
import { ollamaProvider } from "./ollama.js";
import { groqProvider } from "./groq.js";
import { openaiProvider } from "./openai.js";
import { mockProvider } from "./mock.js";

let cached: { provider: LlmProvider; embedProvider: LlmProvider } | null = null;

const ALL: Record<AiProvider, LlmProvider> = {
  ollama: ollamaProvider,
  groq: groqProvider,
  openai: openaiProvider,
  mock: mockProvider,
};

export function getRequestedProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER ?? "ollama").toLowerCase();
  if (raw in ALL) return raw as AiProvider;
  return "ollama";
}

async function bestEmbedProvider(): Promise<LlmProvider> {
  if (await ollamaProvider.isAvailable()) return ollamaProvider;
  if (await openaiProvider.isAvailable()) return openaiProvider;
  return mockProvider;
}

/** Resolve best available provider. Ollama first (free local), then Groq/OpenAI cloud. */
export async function resolveProviders(): Promise<{
  provider: LlmProvider;
  embedProvider: LlmProvider;
  active: AiProvider;
}> {
  if (cached) {
    return {
      provider: cached.provider,
      embedProvider: cached.embedProvider,
      active: cached.provider.name,
    };
  }

  const requested = getRequestedProvider();
  const embedProvider = await bestEmbedProvider();

  if (requested === "ollama" && (await ollamaProvider.isAvailable())) {
    cached = { provider: ollamaProvider, embedProvider: ollamaProvider };
    return { provider: ollamaProvider, embedProvider: ollamaProvider, active: "ollama" };
  }

  if (requested === "groq" && (await groqProvider.isAvailable())) {
    cached = { provider: groqProvider, embedProvider };
    return { provider: groqProvider, embedProvider, active: "groq" };
  }

  if (requested === "openai" && (await openaiProvider.isAvailable())) {
    cached = { provider: openaiProvider, embedProvider: openaiProvider };
    return { provider: openaiProvider, embedProvider: openaiProvider, active: "openai" };
  }

  // Auto-fallback chain
  if (await ollamaProvider.isAvailable()) {
    cached = { provider: ollamaProvider, embedProvider: ollamaProvider };
    return { provider: ollamaProvider, embedProvider: ollamaProvider, active: "ollama" };
  }
  if (await groqProvider.isAvailable()) {
    cached = { provider: groqProvider, embedProvider };
    return { provider: groqProvider, embedProvider, active: "groq" };
  }
  if (await openaiProvider.isAvailable()) {
    cached = { provider: openaiProvider, embedProvider: openaiProvider };
    return { provider: openaiProvider, embedProvider: openaiProvider, active: "openai" };
  }

  cached = { provider: mockProvider, embedProvider: mockProvider };
  return { provider: mockProvider, embedProvider: mockProvider, active: "mock" };
}

export async function getProviderStatus() {
  const { active, embedProvider } = await resolveProviders();
  return {
    active,
    embedProvider: embedProvider.name,
    requested: getRequestedProvider(),
    ollama: await ollamaProvider.isAvailable(),
    groq: await groqProvider.isAvailable(),
    openai: await openaiProvider.isAvailable(),
  };
}

export function usesRealEmbeddings(active: AiProvider): boolean {
  return active !== "mock";
}
