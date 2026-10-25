import { createHash } from "node:crypto";
import { Router } from "express";
import type { Pool } from "pg";

type Persona = "student" | "professional";

const resources: Record<Persona, readonly string[]> = {
  student: ["overview", "plan", "events", "network"],
  professional: ["feed", "search", "invites", "profile"],
};

function bearerToken(header: string | undefined): string | null {
  const match = header?.match(/^Bearer ([A-Za-z0-9_-]+)$/);
  return match?.[1] ?? null;
}

export function createWorkspaceRouter(pool: Pool): Router {
  const router = Router();

  router.get("/:persona/:resource", async (request, response) => {
    const persona = request.params.persona as Persona;
    const resource = request.params.resource;
    if (!Object.hasOwn(resources, persona) || !resources[persona].includes(resource)) {
      response.status(404).json({ error: "workspace resource not found" });
      return;
    }

    const token = bearerToken(request.header("authorization"));
    if (!token) {
      response.status(401).json({ error: "authentication required" });
      return;
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const result = await pool.query<{ account_type: Persona }>(
      `SELECT users.account_type
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = $1 AND sessions.expires_at > now()`,
      [tokenHash],
    );
    if (!result.rows[0]) {
      response.status(401).json({ error: "invalid or expired session" });
      return;
    }
    if (result.rows[0].account_type !== persona) {
      response.status(403).json({ error: "this workspace does not match your account type" });
      return;
    }

    response.json({ items: [] });
  });

  return router;
}