export interface SearchAttribute {
  name: string;
  embedding: readonly number[];
  evidence?: string;
  score?: number | null;
  priority?: number | null;
}

export interface AttributeMatch {
  requirement: string;
  candidate: string;
  cosineSimilarity: number;
  similarity: number;
  weight: number;
}

export interface AttributeRanking {
  score: number;
  passesHardGate: boolean;
  unmatchedHighPriorityRequirements: string[];
  matches: AttributeMatch[];
}

interface PreparedAttribute extends SearchAttribute {
  name: string;
  priorityWeight: number;
  scoreWeight: number;
}

function normalizedWeight(value: number | null | undefined, field: string): number {
  const weight = value ?? 50;
  if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
    throw new RangeError(`${field} must be a number from 0 to 100`);
  }
  return weight / 100;
}

function prepareAttributes(attributes: readonly SearchAttribute[], label: string): PreparedAttribute[] {
  const seen = new Set<string>();
  return attributes.flatMap((attribute) => {
    const name = attribute.name.trim().replace(/\s+/g, " ");
    if (!name) return [];

    const key = name.toLowerCase();
    if (seen.has(key)) return [];
    seen.add(key);

    if (attribute.embedding.length === 0 || attribute.embedding.some((value) => !Number.isFinite(value))) {
      throw new TypeError(`${label} attribute "${name}" must have a finite, non-empty embedding`);
    }

    return [{
      ...attribute,
      name,
      priorityWeight: normalizedWeight(attribute.priority, `${label} priority`),
      scoreWeight: normalizedWeight(attribute.score, `${label} score`),
    }];
  });
}

export function cosineSimilarity(first: readonly number[], second: readonly number[]): number {
  if (first.length === 0 || first.length !== second.length) {
    throw new RangeError("embeddings must have the same non-zero dimension");
  }

  let dotProduct = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;
  for (let index = 0; index < first.length; index += 1) {
    const firstValue = first[index];
    const secondValue = second[index];
    if (!Number.isFinite(firstValue) || !Number.isFinite(secondValue)) {
      throw new TypeError("embeddings must contain only finite values");
    }
    dotProduct += firstValue * secondValue;
    firstMagnitude += firstValue * firstValue;
    secondMagnitude += secondValue * secondValue;
  }

  if (firstMagnitude === 0 || secondMagnitude === 0) {
    throw new RangeError("embeddings must have a non-zero magnitude");
  }

  return Math.max(-1, Math.min(1, dotProduct / Math.sqrt(firstMagnitude * secondMagnitude)));
}

export function rankAttributes(
  requirements: readonly SearchAttribute[],
  candidates: readonly SearchAttribute[],
  hardGateCosineThreshold: number,
): AttributeRanking {
  if (!Number.isFinite(hardGateCosineThreshold) || hardGateCosineThreshold < -1 || hardGateCosineThreshold > 1) {
    throw new RangeError("hard-gate cosine threshold must be between -1 and 1");
  }

  const preparedRequirements = prepareAttributes(requirements, "requirement");
  const preparedCandidates = prepareAttributes(candidates, "candidate");
  const unmatchedHighPriorityRequirements: string[] = [];
  const matches: AttributeMatch[] = [];
  let weightedSimilarity = 0;
  let totalWeight = 0;

  for (const requirement of preparedRequirements) {
    let passesRequirementGate = false;
    for (const candidate of preparedCandidates) {
      const cosine = cosineSimilarity(requirement.embedding, candidate.embedding);
      const similarity = (cosine + 1) / 2;
      const weight = requirement.priorityWeight * candidate.scoreWeight;
      weightedSimilarity += weight * similarity;
      totalWeight += weight;
      matches.push({
        requirement: requirement.name,
        candidate: candidate.name,
        cosineSimilarity: cosine,
        similarity,
        weight,
      });

      if (requirement.priority !== null && requirement.priority !== undefined && requirement.priority > 95 &&
        candidate.scoreWeight > 0 && cosine >= hardGateCosineThreshold) {
        passesRequirementGate = true;
      }
    }
    if (requirement.priority !== null && requirement.priority !== undefined && requirement.priority > 95 &&
      !passesRequirementGate) {
      unmatchedHighPriorityRequirements.push(requirement.name);
    }
  }

  matches.sort((first, second) =>
    second.weight * second.similarity - first.weight * first.similarity ||
    first.requirement.localeCompare(second.requirement) ||
    first.candidate.localeCompare(second.candidate),
  );

  return {
    score: totalWeight === 0 ? 0 : weightedSimilarity / totalWeight,
    passesHardGate: unmatchedHighPriorityRequirements.length === 0,
    unmatchedHighPriorityRequirements,
    matches,
  };
}