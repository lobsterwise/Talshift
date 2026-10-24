import express from "express";
import { Pool } from "pg";
import path from "node:path";
import { readFile } from "node:fs/promises";
import dotenv from "dotenv";
import { createAuthRouter } from "./auth";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set to a reachable PostgreSQL database");
}

const app = express();
const pool = new Pool({
  connectionString: databaseUrl,
});
const port = Number(process.env.PORT ?? 3000);
const frontendDist = process.env.FRONTEND_DIST
  ? path.resolve(process.env.FRONTEND_DIST)
  : path.resolve(__dirname, "../../frontend/dist");

app.use(express.json({ limit: "16kb" }));

app.get("/api/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok" });
  } catch {
    response.status(503).json({ status: "unavailable" });
  }
});

app.use("/api/auth", createAuthRouter(pool));

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

async function startServer(): Promise<void> {
  const schemaPath = path.resolve(__dirname, "../sql/init.sql");
  const schema = await readFile(schemaPath, "utf8");
  await pool.query(schema);

  app.listen(port, "0.0.0.0", () => {
    console.log(`Talshift backend listening on port ${port}`);
  });
}

startServer().catch(async (error: unknown) => {
  console.error("Failed to initialize backend", error);
  await pool.end();
  process.exitCode = 1;
});