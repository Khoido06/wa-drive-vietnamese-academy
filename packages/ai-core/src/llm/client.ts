import type { RagConfig } from "../types.js";
import { resolveProviders } from "./providers/resolver.js";

export { getProviderStatus, usesRealEmbeddings } from "./providers/resolver.js";

type ChatMessage = { role: "system" | "user"; content: string };

export async function embedText(text: string, config: RagConfig): Promise<number[]> {
  const { embedProvider } = await resolveProviders();
  return embedProvider.embed(text, config);
}

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  config: RagConfig,
): Promise<string> {
  const { provider } = await resolveProviders();
  return provider.complete(systemPrompt, userPrompt, config);
}

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  config: RagConfig,
): Promise<T> {
  const { provider } = await resolveProviders();
  return provider.completeJSON<T>(systemPrompt, userPrompt, config);
}

async function* readOpenAiSseStream(
  res: Response,
): AsyncGenerator<string> {
  if (!res.body) throw new Error("Empty stream body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const token = json.choices?.[0]?.delta?.content;
          if (token) yield token;
        } catch {
          // skip malformed SSE chunk
        }
      }
    }
  }
}

async function* streamGroq(
  systemPrompt: string,
  userPrompt: string,
  config: RagConfig,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: config.generationModel,
      messages,
      stream: true,
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Groq stream failed (${res.status}): ${text}`);
  }

  yield* readOpenAiSseStream(res);
}

async function* streamOpenAi(
  systemPrompt: string,
  userPrompt: string,
  config: RagConfig,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: config.generationModel,
      messages,
      stream: true,
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`OpenAI stream failed (${res.status}): ${text}`);
  }

  yield* readOpenAiSseStream(res);
}

async function* streamOllama(
  systemPrompt: string,
  userPrompt: string,
  config: RagConfig,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.generationModel,
      messages,
      stream: true,
      options: { temperature: 0.1 },
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Ollama stream failed (${res.status}): ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line) as { message?: { content?: string } };
        const token = json.message?.content;
        if (token) yield token;
      } catch {
        // skip malformed line
      }
    }
  }
}

/** Token streaming — routes to Groq, OpenAI, or Ollama based on active provider */
export async function* streamText(
  systemPrompt: string,
  userPrompt: string,
  config: RagConfig,
): AsyncGenerator<string> {
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const { provider } = await resolveProviders();

  try {
    if (provider.name === "groq") {
      yield* streamGroq(systemPrompt, userPrompt, config, messages);
      return;
    }
    if (provider.name === "openai") {
      yield* streamOpenAi(systemPrompt, userPrompt, config, messages);
      return;
    }
    if (provider.name === "ollama") {
      yield* streamOllama(systemPrompt, userPrompt, config, messages);
      return;
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Stream failed";
    console.warn(`[streamText] ${provider.name} stream failed, falling back: ${reason}`);
  }

  const fallback = await generateCompletion(systemPrompt, userPrompt, config);
  if (fallback) yield fallback;
}
