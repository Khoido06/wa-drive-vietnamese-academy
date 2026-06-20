import OpenAI from "openai";
import type { RagConfig } from "../../types.js";
import type { LlmProvider } from "./types.js";

/** Groq free tier — get key at https://console.groq.com (no credit card) */
function getGroqClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

export const groqProvider: LlmProvider = {
  name: "groq",

  async isAvailable() {
    return !!process.env.GROQ_API_KEY;
  },

  async embed(text: string, config: RagConfig) {
    // Groq has no embedding API — fall through to Ollama for embeds in resolver
    throw new Error("Groq does not provide embeddings");
  },

  async complete(systemPrompt: string, userPrompt: string, config: RagConfig) {
    const client = getGroqClient();
    if (!client) throw new Error("GROQ_API_KEY not set");

    const response = await client.chat.completions.create({
      model: config.generationModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
    });
    return response.choices[0]?.message?.content ?? "";
  },

  async completeJSON<T>(systemPrompt: string, userPrompt: string, config: RagConfig) {
    const client = getGroqClient();
    if (!client) throw new Error("GROQ_API_KEY not set");

    const response = await client.chat.completions.create({
      model: config.generationModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
    const content = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content) as T;
  },
};
