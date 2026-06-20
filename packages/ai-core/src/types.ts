export interface RagChunk {
  id: string;
  content: string;
  sectionTitle: string | null;
  pageNumber: number | null;
  score: number;
}

export interface RetrievalTrace {
  query: string;
  chunks: RagChunk[];
  topK: number;
  latencyMs: number;
  retrievalMode?: "vector" | "keyword";
  stateCode?: string;
}

export interface RagAnswer {
  answer: string;
  answerVi: string;
  trace: RetrievalTrace;
  confidence: number;
  rejected: boolean;
  rejectionReason?: string;
  validatorPassed: boolean;
  recheckerPassed: boolean;
}

export interface RagConfig {
  topK: number;
  chunkSize: number;
  chunkOverlap: number;
  minConfidence: number;
  embeddingModel: string;
  generationModel: string;
  embeddingDimensions: number;
  /** US state corpus filter (default WA) */
  stateCode?: string;
  /** A/B test variant label when active */
  abVariant?: string;
}

export const DEFAULT_RAG_CONFIG: RagConfig = {
  topK: 5,
  chunkSize: 512,
  chunkOverlap: 64,
  minConfidence: 0.6,
  embeddingModel: process.env.EMBED_MODEL ?? process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text",
  generationModel:
    process.env.LLM_MODEL ??
    (process.env.AI_PROVIDER === "groq"
      ? "llama-3.1-8b-instant"
      : process.env.AI_PROVIDER === "openai"
        ? "gpt-4o-mini"
        : (process.env.OLLAMA_LLM_MODEL ?? "qwen2.5:7b")),
  embeddingDimensions: Number(process.env.EMBEDDING_DIMENSIONS ?? 768),
  stateCode: process.env.DEFAULT_STATE_CODE ?? "WA",
};

export interface GeneratedQuestion {
  topic: string;
  questionTextVi: string;
  questionTextEn: string;
  options: Array<{ id: string; textVi: string; textEn?: string }>;
  correctOptionId: string;
  explanationVi: string;
  sourceChunkIds: string[];
}
