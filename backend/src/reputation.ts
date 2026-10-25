export interface ReputationSummary {
  stars: number;
  score: number;
  reviewCount: number;
}

export interface CandidateRank {
  id: string;
  relevance: number;
  reputation: number;
  reviewCount: number;
  finalScore: number;
}

const PRIOR_STARS = 3;
const PRIOR_REVIEWS = 3;
const RELEVANCE_WEIGHT = 0.8;
const REPUTATION_WEIGHT = 0.2;

function boundedScore(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function summarizeReputation(ratings: readonly number[]): ReputationSummary {
  const ratingTotal = ratings.reduce((total, rating) => total + rating, 0);
  const stars = (ratingTotal + PRIOR_STARS * PRIOR_REVIEWS) / (ratings.length + PRIOR_REVIEWS);
  return {
    stars,
    score: (stars - 1) / 4,
    reviewCount: ratings.length,
  };
}

export function composeCandidateRank(
  id: string,
  relevance: number,
  reputation: ReputationSummary,
): CandidateRank {
  const boundedRelevance = boundedScore(relevance);
  const boundedReputation = boundedScore(reputation.score);
  return {
    id,
    relevance: boundedRelevance,
    reputation: boundedReputation,
    reviewCount: reputation.reviewCount,
    finalScore: RELEVANCE_WEIGHT * boundedRelevance + REPUTATION_WEIGHT * boundedReputation,
  };
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function orderCandidatesWithExploration<T extends CandidateRank>(
  candidates: readonly T[],
  seed: string,
  cadence = 10,
): (T & { isExploration: boolean })[] {
  if (!Number.isInteger(cadence) || cadence < 2) throw new Error("exploration cadence must be an integer of at least 2");

  const ranked = [...candidates].sort((first, second) =>
    second.finalScore - first.finalScore || first.id.localeCompare(second.id),
  );
  const rankedPosition = new Map(ranked.map((candidate, index) => [candidate.id, index]));
  const remaining = new Map(ranked.map((candidate) => [candidate.id, candidate]));
  const ordered: (T & { isExploration: boolean })[] = [];

  while (remaining.size > 0) {
    const position = ordered.length + 1;
    if (position % cadence === 0) {
      const lowerRanked = [...remaining.values()].filter((candidate) =>
        (rankedPosition.get(candidate.id) ?? -1) >= position,
      );
      const lowerReputationCutoff = lowerRanked.reduce((total, candidate) => total + candidate.reputation, 0) /
        Math.max(lowerRanked.length, 1);
      const lowerReputation = lowerRanked.filter((candidate) => candidate.reputation < lowerReputationCutoff);
      const explorationPool = lowerReputation.length > 0 ? lowerReputation : lowerRanked;
      if (explorationPool.length > 0) {
        explorationPool.sort((first, second) =>
          first.reviewCount - second.reviewCount ||
          stableHash(`${seed}:${position}:${first.id}`) - stableHash(`${seed}:${position}:${second.id}`) ||
          first.id.localeCompare(second.id),
        );
        const selected = explorationPool[0];
        ordered.push({ ...selected, isExploration: true });
        remaining.delete(selected.id);
        continue;
      }
    }

    const next = remaining.values().next().value as T | undefined;
    if (!next) break;
    ordered.push({ ...next, isExploration: false });
    remaining.delete(next.id);
  }

  return ordered;
}