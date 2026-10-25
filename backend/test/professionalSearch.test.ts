import assert from "node:assert/strict";
import express from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import type { Pool } from "pg";
import { after, before, describe, it } from "node:test";
import { createProfessionalSearchRouter, parseProfessionalAttributes } from "../src/professionalSearch";

describe("parseProfessionalAttributes", () => {
  it("deduplicates names and bounds priorities without creating score fields", () => {
    const attributes = parseProfessionalAttributes([
      { name: "  Data   modeling ", category: "hard_skill", priority: 72.4, evidence: "Required for the role" },
      { name: "data modeling", category: "technology", priority: 101, evidence: "Repeated as essential" },
      { name: "Mentoring", priority: -5, evidence: "A support topic" },
      { name: "", category: "other", priority: 80, evidence: "Empty label" },
    ]);

    assert.deepEqual(attributes, [
      { name: "data modeling", category: "technology", priority: 100, evidence: "Repeated as essential" },
      { name: "Mentoring", category: "other", priority: 0, evidence: "A support topic" },
    ]);
    assert.equal("score" in attributes[0], false);
  });

  it("rejects a response that is not an attribute list", () => {
    assert.throws(() => parseProfessionalAttributes({}), /invalid professional attributes/i);
  });
});

describe("professional review endpoints", () => {
  let server: Server;
  let baseUrl = "";

  before(async () => {
    const app = express();
    app.use(express.json());
    const pool = {
      query: async (query: string) => query.includes("users.account_type = 'professional'")
        ? { rows: [{ id: "17" }] }
        : { rows: [] },
    } as unknown as Pool;
    app.use("/api/professional/search", createProfessionalSearchRouter(pool));
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}/api/professional/search`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("requires a professional session to read queues", async () => {
    const response = await fetch(`${baseUrl}/queues/1`);
    assert.equal(response.status, 401);
  });

  it("rejects invalid queue sources before attempting persistence", async () => {
    const response = await fetch(`${baseUrl}/queues`, {
      method: "POST",
      headers: { Authorization: "Bearer test_token", "Content-Type": "application/json" },
      body: JSON.stringify({ sourceType: "professional_offer", sourceId: "profile" }),
    });
    assert.equal(response.status, 400);
  });

  it("requires an integer star rating and queue position", async () => {
    const response = await fetch(`${baseUrl}/queues/1/review`, {
      method: "POST",
      headers: { Authorization: "Bearer test_token", "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 6, reviewText: "Too high", expectedPosition: 0 }),
    });
    assert.equal(response.status, 400);
  });

  it("requires recruiter review text to be present", async () => {
    const response = await fetch(`${baseUrl}/queues/1/review`, {
      method: "POST",
      headers: { Authorization: "Bearer test_token", "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 4, reviewText: "   ", expectedPosition: 0 }),
    });
    assert.equal(response.status, 400);
  });
});