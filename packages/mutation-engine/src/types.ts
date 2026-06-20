export type MutationType =
  | "rewrite_question"
  | "adjust_retrieval"
  | "update_chunking"
  | "improve_prompt"
  | "reorder_curriculum"
  | "adjust_ui";

export interface SystemInsight {
  metric: string;
  value: number;
  threshold: number;
  mutationType: MutationType;
  description: string;
}

export interface MutationProposal {
  mutationType: MutationType;
  triggerMetric: string;
  triggerValue: number;
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
}

export interface AnalyticsSnapshot {
  learningSuccessRate: number;
  examPassRate: number;
  avgQuestionAccuracy: number;
  avgRetrievalConfidence: number;
  frustrationSignals: number;
  dropOffPoints: Array<{ screen: string; count: number }>;
  ambiguousQuestions: number;
  weakRagAnswers: number;
}

export interface MutationResult {
  insights: SystemInsight[];
  proposals: MutationProposal[];
  applied: number;
}
