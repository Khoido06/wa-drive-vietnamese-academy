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
  syncUserDisplayName,
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
  type PracticeMode,
} from "./curated-exam.js";

export {
  selectNextCuratedQuestion,
  computeAvoidTopics,
  recentQuestionIds,
  RECENT_EXCLUDE_COUNT,
} from "./question-selection.js";

export {
  getStudyStats,
  recordStudyActivity,
  mergeStudyStats,
  updateStudyPreferences,
  type StudyStatsDto,
} from "./study-stats.js";

export {
  getPracticalProgress,
  mergePracticalProgress,
  type PracticalProgressDto,
} from "./practical-progress.js";

export {
  WA_DRIVE_TEST_INFO,
  WA_PRACTICAL_MANEUVERS,
  WA_VEHICLE_CHECKLIST,
  WA_DAY_OF_TEST_CHECKLIST,
  WA_SCORING_CATEGORIES,
  WA_DOL_DRIVE_VIDEOS,
  type PracticalManeuver,
  type PracticalStep,
  type PracticalQuiz,
  type ChecklistItem,
} from "./wa-practical.js";
