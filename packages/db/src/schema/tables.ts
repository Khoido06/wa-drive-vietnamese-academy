import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  index,
  customType,
} from "drizzle-orm/pg-core";

const EMBED_DIMS = Number(process.env.EMBEDDING_DIMENSIONS ?? 768);

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return `vector(${EMBED_DIMS})`;
  },
  toDriver(value: number[]) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string) {
    return value
      .slice(1, -1)
      .split(",")
      .map((v) => parseFloat(v));
  },
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull(),
  locale: text("locale").notNull().default("vi"),
  clerkId: text("clerk_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ragChunks = pgTable(
  "rag_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceDocument: text("source_document").notNull(),
    pageNumber: integer("page_number"),
    sectionTitle: text("section_title"),
    content: text("content").notNull(),
    embedding: vector("embedding"),
    chunkIndex: integer("chunk_index").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("rag_chunks_source_idx").on(table.sourceDocument),
    index("rag_chunks_section_idx").on(table.sectionTitle),
  ],
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topic: text("topic").notNull(),
    questionTextVi: text("question_text_vi").notNull(),
    questionTextEn: text("question_text_en"),
    options: jsonb("options")
      .$type<Array<{ id: string; textVi: string; textEn?: string }>>()
      .notNull(),
    correctOptionId: text("correct_option_id").notNull(),
    explanationVi: text("explanation_vi"),
    sourceChunkIds: jsonb("source_chunk_ids").$type<string[]>().notNull(),
    difficultyScore: real("difficulty_score").notNull().default(0.5),
    ambiguityScore: real("ambiguity_score").notNull().default(0),
    timesAsked: integer("times_asked").notNull().default(0),
    timesCorrect: integer("times_correct").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
    mutatedAt: timestamp("mutated_at"),
  },
  (table) => [
    index("questions_topic_idx").on(table.topic),
    index("questions_difficulty_idx").on(table.difficultyScore),
  ],
);

export const userAttempts = pgTable(
  "user_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id),
    selectedOptionId: text("selected_option_id").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    responseTimeMs: integer("response_time_ms").notNull(),
    context: text("context").notNull().default("practice"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("attempts_user_idx").on(table.userId),
    index("attempts_question_idx").on(table.questionId),
  ],
);

export const masteryStates = pgTable(
  "mastery_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    topic: text("topic").notNull(),
    easeFactor: real("ease_factor").notNull().default(2.5),
    intervalDays: real("interval_days").notNull().default(1),
    repetitions: integer("repetitions").notNull().default(0),
    nextReviewAt: timestamp("next_review_at").defaultNow().notNull(),
    masteryLevel: real("mastery_level").notNull().default(0),
    totalAttempts: integer("total_attempts").notNull().default(0),
    correctAttempts: integer("correct_attempts").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("mastery_user_topic_idx").on(table.userId, table.topic),
  ],
);

export const telemetryEvents = pgTable(
  "telemetry_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    sessionId: text("session_id").notNull(),
    eventType: text("event_type").notNull(),
    screen: text("screen"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("telemetry_type_idx").on(table.eventType),
    index("telemetry_session_idx").on(table.sessionId),
    index("telemetry_created_idx").on(table.createdAt),
  ],
);

export const ragTraces = pgTable(
  "rag_traces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    query: text("query").notNull(),
    retrievedChunkIds: jsonb("retrieved_chunk_ids").$type<string[]>().notNull(),
    generatedAnswer: text("generated_answer"),
    validatorPassed: boolean("validator_passed").notNull(),
    recheckerPassed: boolean("rechecker_passed").notNull(),
    rejected: boolean("rejected").notNull().default(false),
    rejectionReason: text("rejection_reason"),
    confidence: real("confidence"),
    latencyMs: integer("latency_ms"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("rag_traces_created_idx").on(table.createdAt)],
);

export const systemMutations = pgTable(
  "system_mutations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mutationType: text("mutation_type").notNull(),
    triggerMetric: text("trigger_metric").notNull(),
    triggerValue: real("trigger_value").notNull(),
    beforeState: jsonb("before_state").$type<Record<string, unknown>>(),
    afterState: jsonb("after_state").$type<Record<string, unknown>>().notNull(),
    applied: boolean("applied").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    appliedAt: timestamp("applied_at"),
  },
  (table) => [index("mutations_type_idx").on(table.mutationType)],
);

export const systemConfig = pgTable("system_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
