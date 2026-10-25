import { createHash } from "node:crypto";
import { Router } from "express";
import type { Pool } from "pg";

function bearerToken(header: string | undefined): string | null {
  const match = header?.match(/^Bearer ([A-Za-z0-9_-]+)$/);
  return match?.[1] ?? null;
}

export function createDiscoveryRouter(pool: Pool): Router {
  const router = Router();

  async function getAccountId(authorization: string | undefined): Promise<string | null> {
    const token = bearerToken(authorization);
    if (!token) return null;
    const result = await pool.query<{ id: string }>(
      `SELECT users.id
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = $1 AND sessions.expires_at > now()`,
      [createHash("sha256").update(token).digest("hex")],
    );
    return result.rows[0]?.id ?? null;
  }

  router.get("/settings", async (request, response) => {
    const accountId = await getAccountId(request.header("authorization"));
    if (!accountId) {
      response.status(401).json({ error: "valid authentication is required" });
      return;
    }
    const result = await pool.query<{ discoverable: boolean }>(
      "SELECT discoverable FROM search_settings WHERE user_id = $1",
      [accountId],
    );
    response.json({ discoverable: result.rows[0]?.discoverable ?? false });
  });

  router.put("/settings", async (request, response) => {
    const accountId = await getAccountId(request.header("authorization"));
    if (!accountId) {
      response.status(401).json({ error: "valid authentication is required" });
      return;
    }
    if (typeof request.body?.discoverable !== "boolean") {
      response.status(400).json({ error: "discoverable must be a boolean" });
      return;
    }
    const result = await pool.query<{ discoverable: boolean }>(
      `INSERT INTO search_settings (user_id, discoverable)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE
       SET discoverable = EXCLUDED.discoverable, updated_at = now()
       RETURNING discoverable`,
      [accountId, request.body.discoverable],
    );
    response.json({ discoverable: result.rows[0].discoverable });
  });

  return router;
}