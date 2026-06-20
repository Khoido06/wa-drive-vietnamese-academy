import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractQueryTerms, isAnswerGrounded, keywordScore, rankByKeywords } from "./keyword-search.js";

describe("keywordScore", () => {
  it("scores higher when query terms appear in content", () => {
    const score = keywordScore(
      "Tốc độ tối đa trong khu dân cư",
      "Giới hạn tốc độ là 25 dặm/giờ trong khu dân cư.",
    );
    assert.ok(score > 0.3);
  });

  it("returns 0 for unrelated content", () => {
    assert.equal(keywordScore("đèn vàng", "Giấy phép lái xe Washington"), 0);
  });
});

describe("rankByKeywords", () => {
  it("returns top matching chunks", () => {
    const ranked = rankByKeywords(
      "tốc độ dân cư",
      [
        { id: "1", content: "Giới hạn tốc độ 25 dặm/giờ khu dân cư", sectionTitle: null, pageNumber: 1 },
        { id: "2", content: "Đăng ký xe tại Washington", sectionTitle: null, pageNumber: 2 },
      ],
      1,
    );
    assert.equal(ranked[0]?.id, "1");
  });
});

describe("isAnswerGrounded", () => {
  it("passes when answer words appear in chunks", () => {
    const chunks = [{ id: "1", content: "Giới hạn tốc độ 25 dặm/giờ", sectionTitle: null, pageNumber: 1, score: 1 }];
    assert.ok(isAnswerGrounded("Tốc độ tối đa là 25 dặm/giờ trong khu dân cư", chunks));
  });
});

describe("extractQueryTerms", () => {
  it("extracts meaningful terms", () => {
    const terms = extractQueryTerms("Tốc độ tối đa?");
    assert.ok(terms.length >= 2);
  });
});
