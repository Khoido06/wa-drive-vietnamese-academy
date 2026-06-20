export {
  updateSpacedRepetition,
  updateDifficulty,
  qualityFromAttempt,
  detectFailureClusters,
  reorderCurriculum,
  WA_DRIVER_TOPICS,
  type FailureCluster,
  type WaDriverTopic,
} from "./spaced-repetition.js";

export {
  getOrCreateUser,
  getNextQuestion,
  recordAttempt,
  getProgress,
  analyzeFailureClusters,
  getOptimizedCurriculum,
  trackTelemetry,
  type NextQuestionResult,
} from "./engine.js";
