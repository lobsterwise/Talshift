import express from "express";
import { Pool } from "pg";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set to a reachable PostgreSQL database");
}

const app = express();
const pool = new Pool({ connectionString: databaseUrl });
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