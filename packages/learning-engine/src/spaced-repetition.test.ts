import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectFailureClusters,
  qualityFromAttempt,
  reorderCurriculum,
  updateSpacedRepetition,
  WA_DRIVER_TOPICS,
} from "./spaced-repetition.js";

describe("updateSpacedRepetition", () => {
  it("resets interval on wrong answer", () => {
    const result = updateSpacedRepetition(
      { easeFactor: 2.5, intervalDays: 10, repetitions: 3, totalAttempts: 5, correctAttempts: 3 },
      1,
    );
    assert.equal(result.repetitions, 0);
    assert.equal(result.intervalDays, 1);
  });

  it("increases interval on correct answer", () => {
    const result = updateSpacedRepetition(
      { easeFactor: 2.5, intervalDays: 1, repetitions: 1, totalAttempts: 2, correctAttempts: 2 },
      4,
    );
    assert.ok(result.intervalDays >= 3);
  });
});

describe("detectFailureClusters", () => {
  it("finds topics with high failure rate", () => {
    const clusters = detectFailureClusters([
      { topic: "speed_limits", isCorrect: false, responseTimeMs: 10000 },
      { topic: "speed_limits", isCorrect: false, responseTimeMs: 12000 },
      { topic: "speed_limits", isCorrect: true, responseTimeMs: 8000 },
      { topic: "parking", isCorrect: true, responseTimeMs: 5000 },
    ]);
    assert.equal(clusters[0]?.topic, "speed_limits");
  });
});

describe("reorderCurriculum", () => {
  it("prioritizes failure cluster topics", () => {
    const order = reorderCurriculum(WA_DRIVER_TOPICS, [
      { topic: "speed_limits", failureRate: 0.8, attemptCount: 5, avgResponseTimeMs: 9000 },
    ]);
    assert.equal(order[0], "speed_limits");
  });
});

describe("qualityFromAttempt", () => {
  it("returns low quality for incorrect answers", () => {
    assert.equal(qualityFromAttempt(false, 5000), 1);
  });
});
