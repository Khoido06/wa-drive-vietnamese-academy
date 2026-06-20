import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runRagEval, sanityCheckKeywordScorer } from "./run-eval.js";

describe("RAG golden eval", () => {
  it("passes keyword scorer sanity check", () => {
    assert.equal(sanityCheckKeywordScorer(), true);
  });

  it("meets minimum retrieval pass rate on golden queries", () => {
    const report = runRagEval();
    assert.ok(report.total >= 10, "should have at least 10 golden queries");
    assert.ok(
      report.ok,
      `pass rate ${(report.passRate * 100).toFixed(1)}% below threshold`,
    );
  });
});
