import OpenAI from "openai";
import type { RagConfig } from "../../types.js";
import type { LlmProvider } from "./types.js";

function getOpenAIClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export const openaiProvider: LlmProvider = {
  name: "openai",

  async isAvailable() {
    return !!process.env.OPENAI_API_KEY;
  },

  async embed(text: string, config: RagConfig) {
    const client = getOpenAIClient();
    if (!client) throw new Error("OPENAI_API_KEY not set");

    const model =
      config.embeddingModel.includes("embed") ? config.embeddingModel : "text-embedding-3-small";

    const response = await client.embeddings.create({
      model,
      input: text,
      dimensions: config.embeddingDimensions,
    });
    const vec = response.data[0]?.embedding;
    if (!vec) throw new Error("OpenAI returned empty embedding");
    return vec;
  },

  async complete(systemPrompt: string, userPrompt: string, config: RagConfig) {
    const client = getOpenAIClient();
    if (!client) throw new Error("OPENAI_API_KEY not set");

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
    const client = getOpenAIClient();
    if (!client) throw new Error("OPENAI_API_KEY not set");

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
