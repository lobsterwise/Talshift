import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Router } from "express";
import type { Pool, PoolClient } from "pg";

const scrypt = promisify(scryptCallback);
const passwordKeyLength = 64;
const sessionLifetimeDays = 30;

type AccountType = "student" | "professional";

interface Account {
  id: string;
  email: string;
  accountType: AccountType;
  createdAt: Date;
}

interface AccountRow {
  id: string;
  email: string;
  account_type: AccountType;
  created_at: Date;
  password_hash?: string;
  password_salt?: string;
}

interface Profile {
  fullName: string;
  interests: string[];
  onboardingCompleted: boolean;
  institution?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
  jobTitle?: string;
  organization?: string;
  professionalFocus?: string;
  yearsExperience?: number;
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    email: row.email,
    accountType: row.account_type,
    createdAt: row.created_at,
  };
}

function isAccountType(value: unknown): value is AccountType {
  return value === "student" || value === "professional";
}

function readCredentials(body: unknown): {
  email: string;
  password: string;
  accountType?: AccountType;
} | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const input = body as Record<string, unknown>;
  if (typeof input.email !== "string" || typeof input.password !== "string") {
    return null;
  }

  const email = input.email.trim().toLowerCase();
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    input.password.length < 8 ||
    input.password.length > 128
  ) {
    return null;
  }

  if (input.accountType !== undefined && !isAccountType(input.accountType)) {
    return null;
  }

  return {
    email,
    password: input.password,
    ...(input.accountType === undefined ? {} : { accountType: input.accountType }),
  };
}

async function hashPassword(password: string, salt: Buffer): Promise<Buffer> {
  return (await scrypt(password, salt, passwordKeyLength)) as Buffer;
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function createSession(
  client: Pool | PoolClient,
  accountId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const result = await client.query<{ expires_at: Date }>(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 * interval '1 day'))
     RETURNING expires_at`,
    [accountId, hashSessionToken(token), sessionLifetimeDays],
  );
  return { token, expiresAt: result.rows[0].expires_at };
}

function bearerToken(header: string | undefined): string | null {
  const match = header?.match(/^Bearer ([A-Za-z0-9_-]+)$/);
  return match?.[1] ?? null;
}

function readProfile(body: unknown, accountType: AccountType): Profile | null {
  if (typeof body !== "object" || body === null) return null;

  const input = body as Record<string, unknown>;
  if (
    typeof input.fullName !== "string" ||
    input.fullName.trim().length === 0 ||
    input.fullName.length > 120 ||
    !Array.isArray(input.interests) ||
    input.interests.length > 20 ||
    !input.interests.every((interest) => typeof interest === "string" && interest.length <= 80)
  ) {
    return null;
  }

  if (accountType === "student") {
    if (
      typeof input.institution !== "string" || input.institution.length > 120 ||
      typeof input.fieldOfStudy !== "string" || input.fieldOfStudy.length > 120 ||
      !Number.isInteger(input.graduationYear)
    ) return null;

    return {
      fullName: input.fullName.trim(),
      interests: input.interests,
      onboardingCompleted: true,
      institution: input.institution,
      fieldOfStudy: input.fieldOfStudy,
      graduationYear: input.graduationYear as number,
    };
  }

  if (
    typeof input.jobTitle !== "string" || input.jobTitle.length > 120 ||
    typeof input.organization !== "string" || input.organization.length > 120 ||
    typeof input.professionalFocus !== "string" || input.professionalFocus.length > 120 ||
    !Number.isInteger(input.yearsExperience) ||
    (input.yearsExperience as number) < 0
  ) return null;

  return {
    fullName: input.fullName.trim(),
    interests: input.interests,
    onboardingCompleted: true,
    jobTitle: input.jobTitle,
    organization: input.organization,
    professionalFocus: input.professionalFocus,
    yearsExperience: input.yearsExperience as number,
  };
}

export function createAuthRouter(pool: Pool): Router {
  const router = Router();

  router.post("/register", async (request, response) => {
    const credentials = readCredentials(request.body);
    if (!credentials || !credentials.accountType) {
      response.status(400).json({
        error: "email, password (8-128 characters), and accountType (student or professional) are required",
      });
      return;
    }

    const salt = randomBytes(16);
    const passwordHash = await hashPassword(credentials.password, salt);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const inserted = await client.query<AccountRow>(
        `INSERT INTO users (email, password_hash, password_salt, account_type)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, account_type, created_at`,
        [credentials.email, passwordHash.toString("hex"), salt.toString("hex"), credentials.accountType],
      );
      const account = toAccount(inserted.rows[0]);
      const session = await createSession(client, account.id);
      await client.query("COMMIT");

      response.status(201).json({ ...session, account });
    } catch (error) {
      await client.query("ROLLBACK");
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        response.status(409).json({ error: "an account with this email already exists" });
        return;
      }
      throw error;
    } finally {
      client.release();
    }
  });

  router.post("/login", async (request, response) => {
    const credentials = readCredentials(request.body);
    if (!credentials) {
      response.status(400).json({ error: "a valid email and password are required" });
      return;
    }

    const result = await pool.query<AccountRow>(
      `SELECT id, email, account_type, created_at, password_hash, password_salt
       FROM users WHERE lower(email) = $1`,
      [credentials.email],
    );
    const row = result.rows[0];
    if (!row?.password_hash || !row.password_salt) {
      response.status(401).json({ error: "invalid email or password" });
      return;
    }

    const expectedHash = Buffer.from(row.password_hash, "hex");
    const actualHash = await hashPassword(credentials.password, Buffer.from(row.password_salt, "hex"));
    if (expectedHash.length !== actualHash.length || !timingSafeEqual(expectedHash, actualHash)) {
      response.status(401).json({ error: "invalid email or password" });
      return;
    }

    const session = await createSession(pool, row.id);
    response.json({ ...session, account: toAccount(row) });
  });

  router.get("/me", async (request, response) => {
    const token = bearerToken(request.header("authorization"));
    if (!token) {
      response.status(401).json({ error: "authentication required" });
      return;
    }

    const result = await pool.query<AccountRow>(
      `SELECT users.id, users.email, users.account_type, users.created_at
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = $1 AND sessions.expires_at > now()`,
      [hashSessionToken(token)],
    );
    if (!result.rows[0]) {
      response.status(401).json({ error: "invalid or expired session" });
      return;
    }

    response.json({ account: toAccount(result.rows[0]) });
  });

  router.post("/logout", async (request, response) => {
    const token = bearerToken(request.header("authorization"));
    if (!token) {
      response.status(401).json({ error: "authentication required" });
      return;
    }

    await pool.query("DELETE FROM sessions WHERE token_hash = $1", [hashSessionToken(token)]);
    response.status(204).end();
  });

  router.get("/profile", async (request, response) => {
    const token = bearerToken(request.header("authorization"));
    if (!token) {
      response.status(401).json({ error: "authentication required" });
      return;
    }

    const result = await pool.query<{ profile: Profile | null }>(
      `SELECT user_profiles.profile
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       LEFT JOIN user_profiles ON user_profiles.user_id = users.id
       WHERE sessions.token_hash = $1 AND sessions.expires_at > now()`,
      [hashSessionToken(token)],
    );
    if (!result.rows[0]) {
      response.status(401).json({ error: "invalid or expired session" });
      return;
    }
    response.json({ profile: result.rows[0].profile });
  });

  router.put("/profile", async (request, response) => {
    const token = bearerToken(request.header("authorization"));
    if (!token) {
      response.status(401).json({ error: "authentication required" });
      return;
    }

    const session = await pool.query<{ id: string; account_type: AccountType }>(
      `SELECT users.id, users.account_type
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = $1 AND sessions.expires_at > now()`,
      [hashSessionToken(token)],
    );
    const account = session.rows[0];
    if (!account) {
      response.status(401).json({ error: "invalid or expired session" });
      return;
    }

    const profile = readProfile(request.body, account.account_type);
    if (!profile) {
      response.status(400).json({ error: "valid profile details are required" });
      return;
    }

    const result = await pool.query<{ profile: Profile }>(
      `INSERT INTO user_profiles (user_id, profile)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO UPDATE
       SET profile = EXCLUDED.profile, updated_at = now()
       RETURNING profile`,
      [account.id, JSON.stringify(profile)],
    );
    response.json({ profile: result.rows[0].profile });
  });

  return router;
}