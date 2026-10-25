import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";

const embeddingDimensions = 1536;
const maxBatchSize = 64;
const defaultEmbeddingModel = "text-embedding-3-small";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

interface CachedEmbeddingRow {
  content_hash: string;
  model: string;
  embedding: string;
}

interface OpenAiEmbeddingResponse {
  data?: { index?: number; embedding?: number[] }[];
  error?: { message?: string };
}

export interface EmbeddedAttribute {
  text: string;
  contentHash: string;
  model: string;
  embedding: number[];
}

export function normalizeAttributeText(text: string): string {
  return text.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function hashAttributeText(text: string): string {
  return createHash("sha256").update(normalizeAttributeText(text)).digest("hex");
}

export function isRequestTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

function parseEmbedding(value: string): number[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("The embedding cache contains an invalid vector.");
  }
  if (!Array.isArray(parsed) || parsed.length !== embeddingDimensions ||
    !parsed.every((item) => typeof item === "number" && Number.isFinite(item))) {
    throw new Error("The embedding cache contains a vector with invalid dimensions.");
  }
  return parsed;
}

async function requestEmbeddings(texts: readonly string[], model: string, apiKey: string): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (let start = 0; start < texts.length; start += maxBatchSize) {
    const batch = texts.slice(start, start + maxBatchSize);
    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, input: batch, dimensions: embeddingDimensions }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch (error) {
      if (isRequestTimeout(error)) throw new Error("Search keyword embedding timed out. Please try again.");
      throw error;
    }
    if (!response.ok) {
      const providerError = await response.json().catch(() => null) as OpenAiEmbeddingResponse | null;
      console.error("OpenAI embedding request failed", {
        status: response.status,
        model,
        providerMessage: providerError?.error?.message,
      });
      throw new Error("Unable to prepare search attributes right now.");
    }

    const result = await response.json() as OpenAiEmbeddingResponse;
    const data = result.data;
    if (!Array.isArray(data) || data.length !== batch.length) {
      throw new Error("OpenAI returned an incomplete embedding response.");
    }
    const batchEmbeddings = new Array<number[]>(batch.length);
    for (const item of data) {
      if (!Number.isInteger(item.index) || item.index! < 0 || item.index! >= batch.length ||
        !Array.isArray(item.embedding) || item.embedding.length !== embeddingDimensions ||
        !item.embedding.every((value) => Number.isFinite(value))) {
        throw new Error("OpenAI returned an invalid embedding.");
      }
      batchEmbeddings[item.index!] = item.embedding;
    }
    if (batchEmbeddings.some((embedding) => !embedding)) {
      throw new Error("OpenAI returned an incomplete embedding response.");
    }
    embeddings.push(...batchEmbeddings);
  }
  return embeddings;
}

export async function ensureAttributeEmbeddings(
  queryable: Queryable,
  inputTexts: readonly string[],
): Promise<EmbeddedAttribute[]> {
  const uniqueTexts = new Map<string, string>();
  for (const inputText of inputTexts) {
    const normalized = normalizeAttributeText(inputText);
    if (!normalized) continue;
    if (normalized.length > 200) throw new RangeError("search attribute text must not exceed 200 characters");
    uniqueTexts.set(hashAttributeText(normalized), normalized);
  }
  if (uniqueTexts.size === 0) return [];

  const model = process.env.OPENAI_EMBEDDING_MODEL?.trim() || defaultEmbeddingModel;
  const hashes = [...uniqueTexts.keys()];
  const cached = await queryable.query<CachedEmbeddingRow>(
    `SELECT content_hash, model, embedding::text AS embedding
     FROM attribute_embeddings
     WHERE model = $1 AND content_hash = ANY($2::text[])`,
    [model, hashes],
  );
  const embeddings = new Map<string, number[]>();
  for (const row of cached.rows) embeddings.set(row.content_hash, parseEmbedding(row.embedding));

  const missing = hashes.filter((hash) => !embeddings.has(hash));
  if (missing.length > 0) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Search embeddings are not configured. Set OPENAI_API_KEY on the backend.");
    const missingTexts = missing.map((hash) => uniqueTexts.get(hash)!);
    const created = await requestEmbeddings(missingTexts, model, apiKey);
    for (let index = 0; index < missing.length; index += 1) {
      const hash = missing[index];
      const embedding = created[index];
      await queryable.query(
        `INSERT INTO attribute_embeddings (content_hash, model, embedding)
         VALUES ($1, $2, $3::vector)
         ON CONFLICT (content_hash, model) DO NOTHING`,
        [hash, model, `[${embedding.join(",")}]`],
      );
      embeddings.set(hash, embedding);
    }
  }

  return hashes.map((contentHash) => ({
    text: uniqueTexts.get(contentHash)!,
    contentHash,
    model,
    embedding: embeddings.get(contentHash)!,
  }));
}