import type { RagConfig } from "../../types.js";
import type { LlmProvider } from "./types.js";

function mockEmbed(text: string, dimensions: number): number[] {
  const vec = new Array(dimensions).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dimensions] = (vec[i % dimensions] ?? 0) + text.charCodeAt(i) / 1000;
  }
  const magnitude = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / magnitude);
}

export const mockProvider: LlmProvider = {
  name: "mock",

  async isAvailable() {
    return true;
  },

  async embed(text: string, config: RagConfig) {
    return mockEmbed(text, config.embeddingDimensions);
  },

  async complete(_systemPrompt: string, userPrompt: string) {
    return `[Chế độ dev — cài Ollama để có câu trả lời thật]\n\n${userPrompt.slice(0, 300)}...`;
  },

  async completeJSON<T>(_systemPrompt: string, userPrompt: string) {
    throw new Error(
      `Mock provider cannot generate JSON. Install Ollama (free): ollama pull qwen2.5:7b\nQuery: ${userPrompt.slice(0, 80)}`,
    );
  },
};
