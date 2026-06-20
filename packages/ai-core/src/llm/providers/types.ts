import type { RagConfig } from "../../types.js";

export type AiProvider = "ollama" | "groq" | "openai" | "mock";

export interface LlmProvider {
  name: AiProvider;
  embed(text: string, config: RagConfig): Promise<number[]>;
  complete(systemPrompt: string, userPrompt: string, config: RagConfig): Promise<string>;
  completeJSON<T>(systemPrompt: string, userPrompt: string, config: RagConfig): Promise<T>;
  isAvailable(): Promise<boolean>;
}
