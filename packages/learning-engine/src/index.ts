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
  linkClerkUser,
  getNextQuestion,
  recordAttempt,
  getProgress,
  analyzeFailureClusters,
  getOptimizedCurriculum,
  trackTelemetry,
  type NextQuestionResult,
} from "./engine.js";

export {
  getUserTier,
  setUserSubscription,
  setUserState,
  isPremium,
  isUserPremium,
  findUserByStripeCustomer,
  findUserById,
  type SubscriptionTier,
} from "./billing.js";

export {
  createOrganization,
  listOrganizations,
  verifyOrganizationApiKey,
  incrementOrgUsage,
  recordRagFeedback,
  generateApiKey,
} from "./organizations.js";

export {
  createCaregiverInvite,
  acceptCaregiverInvite,
  getSharedProgress,
  listCaregiverLinks,
} from "./family.js";

export {
  getWaExamSets,
  startWaExamSet,
  seedWaExamQuestions,
  getCuratedQuestionCount,
  WA_DMV_EXAM_LENGTH,
  WA_DMV_PASS_COUNT,
  WA_EXAM_SETS,
} from "./curated-exam.js";

export {
  getStudyStats,
  recordStudyActivity,
  mergeStudyStats,
  updateStudyPreferences,
  type StudyStatsDto,
} from "./study-stats.js";
