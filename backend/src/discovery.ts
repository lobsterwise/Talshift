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
    await pool.query(
      `INSERT INTO search_settings (user_id, discoverable)
       VALUES ($1, true)
       ON CONFLICT (user_id) DO UPDATE
       SET discoverable = true, updated_at = now()`,
      [accountId],
    );
    response.json({ discoverable: true });
  });

  router.put("/settings", async (request, response) => {
    const accountId = await getAccountId(request.header("authorization"));
    if (!accountId) {
      response.status(401).json({ error: "valid authentication is required" });
      return;
    }
    if (request.body?.discoverable !== true) {
      response.status(400).json({ error: "profiles cannot be hidden from discovery" });
      return;
    }
    await pool.query(
      `INSERT INTO search_settings (user_id, discoverable)
       VALUES ($1, true)
       ON CONFLICT (user_id) DO UPDATE
       SET discoverable = true, updated_at = now()`,
      [accountId],
    );
    response.json({ discoverable: true });
  });

  return router;
}