import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  selectNextCuratedQuestion,
  computeAvoidTopics,
  recentQuestionIds,
  type AttemptRecord,
} from "./question-selection.js";

const POOL = [
  { id: "q1", topic: "night_driving" },
  { id: "q2", topic: "night_driving" },
  { id: "q3", topic: "traffic_signs" },
  { id: "q4", topic: "speed_limits" },
];

describe("computeAvoidTopics", () => {
  it("avoids topic when last 2 attempts match", () => {
    const attempts: AttemptRecord[] = [
      { questionId: "q1", isCorrect: true, topic: "night_driving" },
      { questionId: "q2", isCorrect: true, topic: "night_driving" },
    ];
    assert.deepEqual(computeAvoidTopics(attempts), ["night_driving"]);
  });

  it("returns empty when topics differ", () => {
    const attempts: AttemptRecord[] = [
      { questionId: "q1", isCorrect: true, topic: "night_driving" },
      { questionId: "q3", isCorrect: true, topic: "traffic_signs" },
    ];
    assert.deepEqual(computeAvoidTopics(attempts), []);
  });
});

describe("recentQuestionIds", () => {
  it("returns up to 10 unique recent ids", () => {
    const attempts: AttemptRecord[] = Array.from({ length: 15 }, (_, i) => ({
      questionId: `q${i}`,
      isCorrect: true,
      topic: "a",
    }));
    assert.equal(recentQuestionIds(attempts).length, 10);
  });
});

describe("selectNextCuratedQuestion", () => {
  it("new mode skips already-correct weak-topic questions", () => {
    const attempts: AttemptRecord[] = [
      { questionId: "q1", isCorrect: true, topic: "night_driving" },
      { questionId: "q2", isCorrect: true, topic: "night_driving" },
    ];
    const picked = selectNextCuratedQuestion(POOL, attempts, {
      mode: "new",
      priorityTopics: ["night_driving"],
      excludeQuestionIds: [],
      avoidTopics: [],
    });
    assert.ok(picked);
    assert.notEqual(picked!.id, "q1");
    assert.notEqual(picked!.id, "q2");
    assert.notEqual(picked!.topic, "night_driving");
  });

  it("review mode prefers wrong answers", () => {
    const attempts: AttemptRecord[] = [
      { questionId: "q3", isCorrect: false, topic: "traffic_signs" },
      { questionId: "q1", isCorrect: true, topic: "night_driving" },
    ];
    const picked = selectNextCuratedQuestion(POOL, attempts, {
      mode: "review",
      priorityTopics: [],
      excludeQuestionIds: [],
      avoidTopics: [],
    });
    assert.equal(picked!.id, "q3");
  });

  it("excludes recent question ids when alternatives exist", () => {
    const attempts: AttemptRecord[] = [{ questionId: "q4", isCorrect: true, topic: "speed_limits" }];
    const picked = selectNextCuratedQuestion(POOL, attempts, {
      mode: "new",
      priorityTopics: [],
      excludeQuestionIds: ["q4"],
      avoidTopics: [],
    });
    assert.notEqual(picked!.id, "q4");
  });
});
