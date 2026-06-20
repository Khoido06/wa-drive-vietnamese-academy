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
