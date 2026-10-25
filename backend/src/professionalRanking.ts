import type { Pool, PoolClient } from "pg";
import { composeCandidateRank, summarizeReputation, type CandidateRank } from "./reputation";
import { rankAttributes, type SearchAttribute } from "./search";

export type HiringSourceType = "professional_demand" | "job_posting";

export interface PublicCandidateProfile {
  summary: string;
  education: { institution: string; degree: string; field: string; startYear: number | null; endYear: number | null; description: string }[];
  jobs: { title: string; company: string; location: string; startDate: string; endDate: string | null; description: string }[];
  projects: { name: string; description: string; skills: string[] }[];
  skills: { name: string; level: string }[];
}

interface StoredAttributeRow {
  owner_id: string;
  name: string;
  evidence: string | null;
  score: number | null;
  embedding: string;
  profile: Record<string, unknown> | null;
  account_profile: Record<string, unknown> | null;
}

export interface RankedStudent extends CandidateRank {
  name: string;
  headline: string;
  location: string;
  fieldOfStudy?: string;
  institution?: string;
  score: number;
  similarity: number;
  reputationStars: number;
  candidateProfile: PublicCandidateProfile;
  matches: { requirement: string; skill: string; similarity: number }[];
}

export class ProfessionalRankingError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function parseVector(value: string): number[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("A stored search embedding is invalid.");
  }
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "number" && Number.isFinite(item))) {
    throw new Error("A stored search embedding is invalid.");
  }
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === "string" ? record[key] as string : "";
}

function recordList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function publicProfile(profile: Record<string, unknown>): PublicCandidateProfile {
  return {
    summary: stringField(profile, "summary"),
    education: recordList(profile.education).map((item) => ({
      institution: stringField(item, "institution"),
      degree: stringField(item, "degree"),
      field: stringField(item, "field"),
      startYear: typeof item.startYear === "number" ? item.startYear : null,
      endYear: typeof item.endYear === "number" ? item.endYear : null,
      description: stringField(item, "description"),
    })),
    jobs: recordList(profile.jobs).map((item) => ({
      title: stringField(item, "title"),
      company: stringField(item, "company"),
      location: stringField(item, "location"),
      startDate: stringField(item, "startDate"),
      endDate: typeof item.endDate === "string" ? item.endDate : null,
      description: stringField(item, "description"),
    })),
    projects: recordList(profile.projects).map((item) => ({
      name: stringField(item, "name"),
      description: stringField(item, "description"),
      skills: Array.isArray(item.skills) ? item.skills.filter((skill): skill is string => typeof skill === "string") : [],
    })),
    skills: recordList(profile.skills).map((item) => ({
      name: stringField(item, "name"),
      level: stringField(item, "level"),
    })),
  };
}

export async function rankProfessionalCandidates(
  pool: Pool | PoolClient,
  professionalId: string,
  sourceType: HiringSourceType,
  sourceId: string,
): Promise<{ items: RankedStudent[]; message?: string }> {
  const requirements = await pool.query<{ name: string; priority: number; embedding: string }>(
    `SELECT search_attributes.name, search_attributes.priority, attribute_embeddings.embedding::text AS embedding
     FROM search_attributes
     JOIN attribute_embeddings
       ON attribute_embeddings.content_hash = search_attributes.embedding_hash
      AND attribute_embeddings.model = search_attributes.embedding_model
     WHERE search_attributes.owner_id = $1
       AND search_attributes.source_type = $2
       AND search_attributes.source_id = $3
       AND search_attributes.extractor_model = $4
     ORDER BY search_attributes.priority DESC, search_attributes.name`,
    [professionalId, sourceType, sourceId, (process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash").replace(/^models\//, "")],
  );
  if (!requirements.rows.length) return { items: [], message: "Prepare search attributes for this hiring source first." };

  const thresholdSetting = process.env.SEARCH_HARD_GATE_COSINE_THRESHOLD?.trim();
  const threshold = Number(thresholdSetting);
  if (!thresholdSetting || !Number.isFinite(threshold) || threshold < -1 || threshold > 1) {
    throw new ProfessionalRankingError(503, "Configure SEARCH_HARD_GATE_COSINE_THRESHOLD to a calibrated value between -1 and 1.");
  }

  const model = (process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash").replace(/^models\//, "");
  const candidates = await pool.query<StoredAttributeRow>(
    `SELECT search_attributes.owner_id,
            search_attributes.name,
            search_attributes.evidence,
            search_attributes.score,
            attribute_embeddings.embedding::text AS embedding,
            student_profiles.profile,
            user_profiles.profile AS account_profile
     FROM search_attributes
     JOIN users ON users.id = search_attributes.owner_id AND users.account_type = 'student'
     JOIN search_settings ON search_settings.user_id = users.id AND search_settings.discoverable = true
     JOIN student_talent ON student_talent.student_id = users.id
     JOIN attribute_embeddings
       ON attribute_embeddings.content_hash = search_attributes.embedding_hash
      AND attribute_embeddings.model = search_attributes.embedding_model
     JOIN student_profiles ON student_profiles.student_id = users.id
     LEFT JOIN user_profiles ON user_profiles.user_id = users.id
     WHERE search_attributes.source_type = 'student_profile'
       AND search_attributes.score > 0
       AND search_attributes.extractor_model = $1
       AND student_talent.talent->>'model' = $1
     ORDER BY search_attributes.owner_id, search_attributes.id`,
    [model],
  );

  const requirementsForRanking: SearchAttribute[] = requirements.rows.map((attribute) => ({
    name: attribute.name,
    priority: attribute.priority,
    embedding: parseVector(attribute.embedding),
  }));
  const byStudent = new Map<string, {
    attributes: SearchAttribute[];
    profile: Record<string, unknown>;
    accountProfile: Record<string, unknown> | null;
  }>();
  for (const row of candidates.rows) {
    const candidate = byStudent.get(row.owner_id) ?? {
      attributes: [],
      profile: row.profile ?? {},
      accountProfile: row.account_profile,
    };
    candidate.attributes.push({
      name: row.name,
      evidence: row.evidence ?? undefined,
      score: row.score,
      embedding: parseVector(row.embedding),
    });
    byStudent.set(row.owner_id, candidate);
  }

  const eligible = [...byStudent.entries()].flatMap(([id, candidate]) => {
    const ranking = rankAttributes(requirementsForRanking, candidate.attributes, threshold);
    if (!ranking.passesHardGate || ranking.score <= 0) return [];
    const accountProfile = candidate.accountProfile ?? {};
    const fieldOfStudy = typeof accountProfile.fieldOfStudy === "string" ? accountProfile.fieldOfStudy : undefined;
    const institution = typeof accountProfile.institution === "string" ? accountProfile.institution : undefined;
    return [{
      id,
      name: typeof accountProfile.fullName === "string" ? accountProfile.fullName : "Student",
      headline: typeof candidate.profile.headline === "string" ? candidate.profile.headline : "",
      location: typeof candidate.profile.location === "string" ? candidate.profile.location : "",
      ...(fieldOfStudy ? { fieldOfStudy } : {}),
      ...(institution ? { institution } : {}),
      candidateProfile: publicProfile(candidate.profile),
      relevance: ranking.score,
      score: ranking.score,
      similarity: ranking.score,
      matches: ranking.matches.filter((match) => match.weight > 0).slice(0, 3).map((match) => ({
        requirement: match.requirement,
        skill: match.candidate,
        similarity: match.similarity,
      })),
    }];
  });

  if (!eligible.length) return { items: [] };
  const ratings = await pool.query<{ student_id: string; rating: number }>(
    `SELECT student_id::text AS student_id, rating
     FROM student_reputation_reviews
     WHERE student_id = ANY($1::bigint[])
     ORDER BY student_id, id`,
    [eligible.map((candidate) => candidate.id)],
  );
  const ratingsByStudent = new Map<string, number[]>();
  for (const row of ratings.rows) {
    const values = ratingsByStudent.get(row.student_id) ?? [];
    values.push(row.rating);
    ratingsByStudent.set(row.student_id, values);
  }

  const items = eligible.map((candidate) => {
    const reputation = summarizeReputation(ratingsByStudent.get(candidate.id) ?? []);
    return {
      ...candidate,
      ...composeCandidateRank(candidate.id, candidate.relevance, reputation),
      reputationStars: reputation.stars,
    };
  }).sort((first, second) =>
    second.finalScore - first.finalScore || second.relevance - first.relevance || first.id.localeCompare(second.id),
  );
  return { items };
}