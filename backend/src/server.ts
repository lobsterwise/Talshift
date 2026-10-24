import express from "express";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import path from "node:path";

interface DatabaseSecret {
  host?: string;
  port?: number;
  dbname?: string;
  username: string;
  password: string;
}

const secretsManager = new SecretsManagerClient({});

async function readDatabaseSecret(secretArn: string): Promise<DatabaseSecret> {
  const result = await secretsManager.send(
    new GetSecretValueCommand({ SecretId: secretArn }),
  );
  if (!result.SecretString) {
    throw new Error("The database secret has no SecretString value");
  }

  return JSON.parse(result.SecretString) as DatabaseSecret;
}

async function createPool(): Promise<Pool> {
  const secretArn = process.env.DATABASE_SECRET_ARN;
  if (secretArn) {
    const secret = await readDatabaseSecret(secretArn);
    const host = process.env.DATABASE_HOST ?? secret.host;
    const port = Number(process.env.DATABASE_PORT ?? secret.port);
    const database = process.env.DATABASE_NAME ?? secret.dbname;
    if (!host || !database || !Number.isInteger(port) || port < 1) {
      throw new Error("Database host, port, and name must be configured");
    }

    return new Pool({
      host,
      port,
      database,
      user: secret.username,
      password: async () => (await readDatabaseSecret(secretArn)).password,
      ssl: {
        rejectUnauthorized: true,
        ...(process.env.DATABASE_SSL_CA
          ? { ca: readFileSync(process.env.DATABASE_SSL_CA, "utf8") }
          : {}),
      },
    });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Set DATABASE_SECRET_ARN or DATABASE_URL");
  }

  return new Pool({ connectionString: databaseUrl });
}

async function main(): Promise<void> {
  const pool = await createPool();
  const app = express();
  const port = Number(process.env.PORT ?? 3000);
  const frontendDist = process.env.FRONTEND_DIST
    ? path.resolve(process.env.FRONTEND_DIST)
    : path.resolve(__dirname, "../../frontend/dist");

  app.get("/api/health", async (_request, response) => {
    try {
      await pool.query("SELECT 1");
      response.json({ status: "ok" });
    } catch {
      response.status(503).json({ status: "unavailable" });
    }
  });

  app.use("/api", (_request, response) => {
    response.status(404).json({ error: "api route not found" });
  });

  app.use(express.static(frontendDist, { index: false }));

  app.get(/.*/, (request, response, next) => {
    if (path.extname(request.path)) {
      response.status(404).json({ error: "not found" });
      return;
    }

    response.sendFile(path.join(frontendDist, "index.html"), (error) => {
      if (error) {
        next(error);
      }
    });
  });

  app.listen(port, "0.0.0.0", () => {
    console.log(`Talshift backend listening on port ${port}`);
  });
}

void main().catch((error: unknown) => {
  console.error("Failed to start Talshift backend", error);
  process.exitCode = 1;
});