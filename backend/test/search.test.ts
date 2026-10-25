import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cosineSimilarity, rankAttributes } from "../src/search";

describe("rankAttributes", () => {
  it("averages every pair using normalized priority and candidate score weights", () => {
    const ranking = rankAttributes(
      [{ name: "Data", embedding: [1, 0], priority: 100 }],
      [
        { name: "Exact", embedding: [1, 0], score: 100 },
        { name: "Related", embedding: [0, 1], score: 100 },
      ],
      0.9,
    );

    assert.equal(ranking.score, 0.75);
    assert.equal(ranking.passesHardGate, true);
    assert.equal(ranking.matches.length, 2);
  });

  it("uses neutral defaults for missing weights and excludes zero-weight pairs", () => {
    const ranking = rankAttributes(
      [{ name: "Requirement", embedding: [1, 0] }],
      [
        { name: "Neutral", embedding: [1, 0] },
        { name: "Unweighted", embedding: [0, 1], score: 0 },
      ],
      0.9,
    );

    assert.equal(ranking.score, 1);
    assert.equal(ranking.matches[1].weight, 0);
  });

  it("fails a high-priority gate when no positively weighted candidate clears the threshold", () => {
    const ranking = rankAttributes(
      [{ name: "Must have", embedding: [1, 0], priority: 96 }],
      [
        { name: "No evidence", embedding: [1, 0], score: 0 },
        { name: "Related", embedding: [0, 1], score: 100 },
      ],
      0.8,
    );

    assert.equal(ranking.passesHardGate, false);
    assert.deepEqual(ranking.unmatchedHighPriorityRequirements, ["Must have"]);
  });

  it("deduplicates normalized names before averaging", () => {
    const ranking = rankAttributes(
      [{ name: "Data", embedding: [1, 0], priority: 100 }],
      [
        { name: "SQL", embedding: [1, 0], score: 100 },
        { name: "  sql  ", embedding: [0, 1], score: 100 },
      ],
      0.9,
    );

    assert.equal(ranking.score, 1);
    assert.equal(ranking.matches.length, 1);
  });
});

describe("cosineSimilarity", () => {
  it("calculates vector cosine similarity", () => {
    assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
    assert.equal(cosineSimilarity([1, 0], [-1, 0]), -1);
  });

  it("rejects incompatible or zero-magnitude embeddings", () => {
    assert.throws(() => cosineSimilarity([1], [1, 0]), RangeError);
    assert.throws(() => cosineSimilarity([0, 0], [1, 0]), RangeError);
  });
});