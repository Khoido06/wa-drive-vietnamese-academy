import type { RagConfig } from "../types.js";
import { resolveProviders } from "./providers/resolver.js";

export { getProviderStatus, usesRealEmbeddings } from "./providers/resolver.js";

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

/** Token streaming — ChatGPT-style (Ollama NDJSON / Groq SSE) */
export async function* streamText(
  systemPrompt: string,
  userPrompt: string,
  config: RagConfig,
): AsyncGenerator<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.generationModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      options: { temperature: 0.1 },
    }),
  });

  if (!res.ok || !res.body) {
    const fallback = await generateCompletion(systemPrompt, userPrompt, config);
    yield fallback;
    return;
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
