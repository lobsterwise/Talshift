import { createHash } from "node:crypto";
import { Router } from "express";
import type { Pool } from "pg";

type PostingStatus = "draft" | "published";

interface Posting {
  id: string;
  title: string;
  description: string;
  applicationUrl: string;
  status: PostingStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface PostingRow {
  id: string;
  title: string;
  description: string;
  application_url: string;
  status: PostingStatus;
  created_at: Date;
  updated_at: Date;
}

const postingColumns = "id, title, description, application_url, status, created_at, updated_at";
const invalidPosting = "title, description, an application link (http or https), and a valid draft or published status are required";

// Accepts "careers.example.com/job" as well as full URLs; only http(s) links are stored.
function readApplicationUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || raw.length > 500) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".") ? url.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
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
  const applicationUrl = readApplicationUrl(input.applicationUrl);
  if (!applicationUrl) return null;
  return { title: input.title.trim(), description: input.description.trim(), applicationUrl, status: input.status };
}

function toPosting(row: PostingRow): Posting {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    applicationUrl: row.application_url,
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
      `SELECT ${postingColumns}
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
      response.status(400).json({ error: invalidPosting });
      return;
    }
    const result = await pool.query<PostingRow>(
      `INSERT INTO professional_postings (owner_id, title, description, application_url, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${postingColumns}`,
      [professionalId, posting.title, posting.description, posting.applicationUrl, posting.status],
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
      response.status(400).json({ error: invalidPosting });
      return;
    }
    const result = await pool.query<PostingRow>(
      `UPDATE professional_postings
       SET title = $3, description = $4, application_url = $5, status = $6, updated_at = now()
       WHERE id = $1 AND owner_id = $2
       RETURNING ${postingColumns}`,
      [postingId, professionalId, posting.title, posting.description, posting.applicationUrl, posting.status],
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