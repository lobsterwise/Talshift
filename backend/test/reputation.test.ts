import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { composeCandidateRank, orderCandidatesWithExploration, summarizeReputation } from "../src/reputation";

describe("student reputation ranking", () => {
  it("starts at a neutral three-star prior and moves with observed ratings", () => {
    assert.deepEqual(summarizeReputation([]), { stars: 3, score: 0.5, reviewCount: 0 });
    const summary = summarizeReputation([1, 5]);
    assert.equal(summary.stars, 3);
    assert.equal(summary.score, 0.5);
    assert.equal(summary.reviewCount, 2);
  });

  it("composes bounded relevance and reputation without replacing either value", () => {
    const rank = composeCandidateRank("candidate", 0.9, summarizeReputation([5]));
    assert.equal(rank.relevance, 0.9);
    assert.equal(rank.reputation, 0.625);
    assert.ok(Math.abs(rank.finalScore - 0.845) < 1e-12);
    assert.equal(composeCandidateRank("bounded", 2, summarizeReputation([])).finalScore, 0.9);
  });

  it("interleaves lower-reputation candidates deterministically without duplicates", () => {
    const candidates = Array.from({ length: 12 }, (_, index) => ({
      id: `candidate-${index}`,
      relevance: 1 - index / 20,
      reputation: index < 2 ? 0.9 : 0.2,
      reviewCount: 1,
      finalScore: 1 - index / 20,
    }));
    const first = orderCandidatesWithExploration(candidates, "stable-session-seed");
    const second = orderCandidatesWithExploration(candidates, "stable-session-seed");

    assert.deepEqual(first.map((candidate) => candidate.id), second.map((candidate) => candidate.id));
    assert.equal(new Set(first.map((candidate) => candidate.id)).size, candidates.length);
    assert.ok(first[9].reputation < 0.9);
  });

  it("still explores the lower-ranked tail when every candidate has neutral cold-start reputation", () => {
    const candidates = Array.from({ length: 12 }, (_, index) => ({
      id: `candidate-${index}`,
      relevance: 1 - index / 20,
      reputation: 0.5,
      reviewCount: 0,
      finalScore: 0.8 * (1 - index / 20) + 0.1,
    }));
    const ordered = orderCandidatesWithExploration(candidates, "cold-start-seed");

    assert.ok(Number(ordered[9].id.split('-')[1]) >= 10);
    assert.equal(ordered[9].isExploration, true);
  });
});