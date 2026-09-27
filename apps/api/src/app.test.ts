import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { createDb } from "./db.js";
import { readConfig } from "./config.js";

describe("API composition", () => {
  it("serves catalog and publishes key OpenAPI routes", async () => {
    const config = readConfig({
      NODE_ENV: "test", DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      BETTER_AUTH_SECRET: "a-secret-with-more-than-thirty-two-characters",
      PUBLIC_BASE_URL: "http://localhost:4000"
    });
    const db = createDb(config.DATABASE_URL);
    const app = await buildApp(config, db);
    try {
      await app.ready();
      const health = await app.inject("/api/health");
      expect(health.statusCode).toBe(200);
      const catalog = await app.inject("/api/catalog");
      expect(catalog.json().species.some((entry: { name: string }) => entry.name === "Pikachu")).toBe(true);
      const damage = await app.inject({ method: "POST", url: "/api/damage", payload: { attacker: { species: "Pikachu" }, defender: { species: "Charizard" }, move: "Thunderbolt", field: {} } });
      expect(damage.statusCode).toBe(200);
      expect(damage.json().max).toBeGreaterThan(0);
      const privateTeams = await app.inject("/api/me/teams");
      expect(privateTeams.statusCode).toBe(401);
      const session = await app.inject({ url: "/api/auth/get-session", headers: { host: "localhost:4000" } });
      expect(session.statusCode).toBe(200);
      const spec = app.swagger();
      expect(spec.paths?.["/api/damage"]?.post?.requestBody).toBeDefined();
      expect(spec.paths?.["/api/me/teams"]?.post?.requestBody).toBeDefined();
    } finally { await app.close(); await db.$disconnect(); }
  });
  it("rejects a raw peer outside the edge even with spoofed forwarding headers", async () => {
    const config = readConfig({ NODE_ENV: "test", EDGE_CIDR: "172.31.11.0/24", DATABASE_URL: "postgresql://test:test@localhost:5432/test", BETTER_AUTH_SECRET: "a-secret-with-more-than-thirty-two-characters", PUBLIC_BASE_URL: "http://localhost:4000" });
    const db = createDb(config.DATABASE_URL);
    const app = await buildApp(config, db);
    try {
      const response = await app.inject({ url: "/api/catalog", headers: { "x-forwarded-for": "172.31.11.42", "x-forwarded-proto": "https" } });
      expect(response.statusCode).toBe(403);
    } finally { await app.close(); await db.$disconnect(); }
  });
});
