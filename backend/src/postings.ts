import { createHash } from "node:crypto";
import { Router } from "express";
import type { Pool } from "pg";

type PostingStatus = "draft" | "published";

interface Posting {
  id: string;
  title: string;
  description: string;
  status: PostingStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface PostingRow {
  id: string;
  title: string;
  description: string;
  status: PostingStatus;
  created_at: Date;
  updated_at: Date;
}

function bearerToken(header: string | undefined): string | null {
  const match = header?.match(/^Bearer ([A-Za-z0-9_-]+)$/);
  return match?.[1] ?? null;
}

function readPosting(value: unknown): Omit<Posting, "id" | "createdAt" | "updatedAt"> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (typeof input.title !== "string" || input.title.trim().length === 0 || input.title.trim().length > 120 ||
    typeof input.description !== "string" || input.description.trim().length === 0 || input.description.length > 4000 ||
    (input.status !== "draft" && input.status !== "published")) return null;
  return { title: input.title.trim(), description: input.description.trim(), status: input.status };
}

function toPosting(row: PostingRow): Posting {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createPostingsRouter(pool: Pool): Router {
  const router = Router();

  async function getProfessionalId(authorization: string | undefined): Promise<string | null> {
    const token = bearerToken(authorization);
    if (!token) return null;
    const result = await pool.query<{ id: string }>(
      `SELECT users.id
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = $1 AND sessions.expires_at > now()
         AND users.account_type = 'professional'`,
      [createHash("sha256").update(token).digest("hex")],
    );
    return result.rows[0]?.id ?? null;
  }

  router.get("/", async (request, response) => {
    const professionalId = await getProfessionalId(request.header("authorization"));
    if (!professionalId) {
      response.status(401).json({ error: "valid professional authentication is required" });
      return;
    }
    const result = await pool.query<PostingRow>(
      `SELECT id, title, description, status, created_at, updated_at
       FROM professional_postings
       WHERE owner_id = $1
       ORDER BY updated_at DESC, id DESC`,
      [professionalId],
    );
    response.json({ items: result.rows.map(toPosting) });
  });

  router.post("/", async (request, response) => {
    const professionalId = await getProfessionalId(request.header("authorization"));
    if (!professionalId) {
      response.status(401).json({ error: "valid professional authentication is required" });
      return;
    }
    const posting = readPosting(request.body);
    if (!posting) {
      response.status(400).json({ error: "title, description, and a valid draft or published status are required" });
      return;
    }
    const result = await pool.query<PostingRow>(
      `INSERT INTO professional_postings (owner_id, title, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, status, created_at, updated_at`,
      [professionalId, posting.title, posting.description, posting.status],
    );
    response.status(201).json({ posting: toPosting(result.rows[0]) });
  });

  router.put("/:postingId", async (request, response) => {
    const professionalId = await getProfessionalId(request.header("authorization"));
    if (!professionalId) {
      response.status(401).json({ error: "valid professional authentication is required" });
      return;
    }
    const postingId = request.params.postingId;
    if (!/^\d+$/.test(postingId)) {
      response.status(404).json({ error: "posting not found" });
      return;
    }
    const posting = readPosting(request.body);
    if (!posting) {
      response.status(400).json({ error: "title, description, and a valid draft or published status are required" });
      return;
    }
    const result = await pool.query<PostingRow>(
      `UPDATE professional_postings
       SET title = $3, description = $4, status = $5, updated_at = now()
       WHERE id = $1 AND owner_id = $2
       RETURNING id, title, description, status, created_at, updated_at`,
      [postingId, professionalId, posting.title, posting.description, posting.status],
    );
    if (!result.rows[0]) {
      response.status(404).json({ error: "posting not found" });
      return;
    }
    await pool.query(
      "DELETE FROM search_attributes WHERE owner_id = $1 AND source_type = 'job_posting' AND source_id = $2",
      [professionalId, postingId],
    );
    response.json({ posting: toPosting(result.rows[0]) });
  });

  router.delete("/:postingId", async (request, response) => {
    const professionalId = await getProfessionalId(request.header("authorization"));
    if (!professionalId) {
      response.status(401).json({ error: "valid professional authentication is required" });
      return;
    }
    const postingId = request.params.postingId;
    if (!/^\d+$/.test(postingId)) {
      response.status(404).json({ error: "posting not found" });
      return;
    }
    const result = await pool.query(
      "DELETE FROM professional_postings WHERE id = $1 AND owner_id = $2",
      [postingId, professionalId],
    );
    if (result.rowCount === 0) {
      response.status(404).json({ error: "posting not found" });
      return;
    }
    await pool.query(
      "DELETE FROM search_attributes WHERE owner_id = $1 AND source_type = 'job_posting' AND source_id = $2",
      [professionalId, postingId],
    );
    response.status(204).end();
  });

  return router;
}