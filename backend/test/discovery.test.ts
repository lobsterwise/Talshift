import assert from "node:assert/strict";
import express from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import type { Pool } from "pg";
import { after, before, describe, it } from "node:test";
import { createDiscoveryRouter } from "../src/discovery";

describe("discovery settings", () => {
  let server: Server;
  let baseUrl = "";
  const queries: string[] = [];

  before(async () => {
    const app = express();
    app.use(express.json());
    const pool = {
      query: async (query: string) => {
        queries.push(query);
        return query.includes("FROM sessions")
          ? { rows: [{ id: "17" }] }
          : { rows: [] };
      },
    } as unknown as Pool;
    app.use("/api/discovery", createDiscoveryRouter(pool));
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}/api/discovery/settings`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("enables discovery when no setting exists", async () => {
    const response = await fetch(baseUrl, {
      headers: { Authorization: "Bearer test_token" },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { discoverable: true });
    assert.ok(queries.some((query) => query.includes("INSERT INTO search_settings")));
  });

  it("rejects attempts to disable discovery", async () => {
    const writesBeforeRequest = queries.filter((query) => query.includes("INSERT INTO search_settings")).length;
    const response = await fetch(baseUrl, {
      method: "PUT",
      headers: { Authorization: "Bearer test_token", "Content-Type": "application/json" },
      body: JSON.stringify({ discoverable: false }),
    });

    assert.equal(response.status, 400);
    assert.equal(
      queries.filter((query) => query.includes("INSERT INTO search_settings")).length,
      writesBeforeRequest,
    );
  });
});
