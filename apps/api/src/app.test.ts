import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { createDb } from "./db.js";
import { readConfig } from "./config.js";
import { apiErrorResponseSchema } from "@pokemon-tools/contracts";

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
      expect(privateTeams.json()).toEqual({ error: "Sign in required", code: "sign-in-required" });
      const blockedSave = await app.inject({ method: "POST", url: "/api/me/teams", payload: { name: "Attack", pokemon: [] } });
      expect(blockedSave.statusCode).toBe(403);
      expect(blockedSave.json()).toEqual({ error: "Untrusted request origin", code: "untrusted-origin" });
      const foreignSave = await app.inject({ method: "POST", url: "/api/me/teams", headers: { origin: "https://attacker.example" }, payload: { name: "Attack", pokemon: [] } });
      expect(foreignSave.statusCode).toBe(403);
      const blockedDelete = await app.inject({ method: "DELETE", url: "/api/me/teams/team-id" });
      expect(blockedDelete.statusCode).toBe(403);
      const sameOriginSave = await app.inject({ method: "POST", url: "/api/me/teams", headers: { origin: "http://localhost:4000" }, payload: { name: "Safe", pokemon: [] } });
      expect(sameOriginSave.statusCode).toBe(401);
      const headers = await app.inject("/api/health");
      expect(headers.headers["content-security-policy"]).toContain("https://raw.githubusercontent.com/PokeAPI/sprites/");
      expect(headers.headers["content-security-policy"]).toContain("script-src 'self'");
      const session = await app.inject({ url: "/api/auth/get-session", headers: { host: "localhost:4000" } });
      expect(session.statusCode).toBe(200);
      const spec = app.swagger();
      expect(spec.paths?.["/api/damage"]?.post?.requestBody).toBeDefined();
      expect(spec.paths?.["/api/me/teams"]?.post?.requestBody).toBeDefined();
      expect(spec.paths?.["/api/catalog"]?.get?.responses?.["200"]).toBeDefined();
      expect(spec.paths?.["/api/type-chart"]?.get?.responses?.["200"]).toBeDefined();
      expect(spec.paths?.["/api/pokedex/{species}"]?.get?.responses?.["400"]).toBeDefined();
      expect(spec.paths?.["/api/pokedex/{species}/evolution"]?.get?.responses?.["200"]).toBeDefined();
      expect(spec.paths?.["/api/pokedex/{species}/evolution"]?.get?.responses?.["200"]).toBeDefined();
      expect(spec.paths?.["/api/damage"]?.post?.responses?.["200"]).toBeDefined();
      expect(spec.paths?.["/api/me/teams"]?.get?.responses?.["200"]).toBeDefined();
      expect(spec.paths?.["/api/me/teams"]?.post?.responses?.["201"]).toBeDefined();
      expect(spec.paths?.["/api/me/teams/{id}"]?.delete?.responses?.["204"]).toBeDefined();
      expect(spec.paths?.["/api/me/teams/{id}"]?.delete?.security).toEqual([{ cookieAuth: [] }]);
    } finally { await app.close(); await db.$disconnect(); }
  });

  it("returns generic 500 errors and never puts private exception text in the response", async () => {
    const config = readConfig({ NODE_ENV: "test", DATABASE_URL: "postgresql://test:test@localhost:5432/test", BETTER_AUTH_SECRET: "a-secret-with-more-than-thirty-two-characters", PUBLIC_BASE_URL: "http://localhost:4000" });
    const db = createDb(config.DATABASE_URL);
    const app = await buildApp(config, db);
    app.get("/api/test-unexpected-error", async () => { throw new Error("sensitive implementation detail"); });
    try {
      const result = await app.inject("/api/test-unexpected-error");
      expect(result.statusCode).toBe(500);
      expect(result.json()).toEqual({ error: "Internal server error", code: "internal-error" });
      expect(apiErrorResponseSchema.safeParse(result.json()).success).toBe(true);
      expect(result.body).not.toContain("sensitive implementation detail");
    } finally { await app.close(); await db.$disconnect(); }
  });
  it("returns canonical name issues and Tera requirements without needing English message parsing", async () => {
    const config = readConfig({ NODE_ENV: "test", DATABASE_URL: "postgresql://test:test@localhost:5432/test", BETTER_AUTH_SECRET: "a-secret-with-more-than-thirty-two-characters", PUBLIC_BASE_URL: "http://localhost:4000" });
    const db = createDb(config.DATABASE_URL);
    const app = await buildApp(config, db);
    try {
      const result = await app.inject({ method: "POST", url: "/api/damage", payload: {
        attacker: { species: "Madeupmon", ability: "Unknown Ability", item: "Unknown Item", nature: "Unknown Nature", teraType: "Unknown Type", moves: ["Unknown Move"] },
        defender: { species: "Pikachu" }, move: "Otro movimiento", field: { defenderTerastallized: true }
      } });
      expect(result.statusCode).toBe(400);
      const body = apiErrorResponseSchema.parse(result.json());
      expect(body.code).toBe("validation-failed");
      expect(body.issues).toEqual([
        { code: "unknown-species", path: ["attacker", "species"], value: "Madeupmon" },
        { code: "unknown-ability", path: ["attacker", "ability"], value: "Unknown Ability" },
        { code: "unknown-item", path: ["attacker", "item"], value: "Unknown Item" },
        { code: "unknown-nature", path: ["attacker", "nature"], value: "Unknown Nature" },
        { code: "unknown-type", path: ["attacker", "teraType"], value: "Unknown Type" },
        { code: "unknown-move", path: ["attacker", "moves", 0], value: "Unknown Move" },
        { code: "unknown-move", path: ["move"], value: "Otro movimiento" },
        { code: "missing-defender-tera-type", path: ["defender", "teraType"] }
      ]);
      expect(body.error).toContain("Unknown species: Madeupmon");
      const species = await app.inject("/api/pokedex/Unknownmon");
      expect(species.statusCode).toBe(400);
      expect(apiErrorResponseSchema.parse(species.json())).toEqual({ error: "Unknown Generation 9 species", code: "unknown-species", issues: [{ code: "unknown-species", path: ["species"], value: "Unknownmon" }] });
    } finally { await app.close(); await db.$disconnect(); }
  });
  it("gives translatable schema constraints and safe transport status codes", async () => {
    const config = readConfig({ NODE_ENV: "test", DATABASE_URL: "postgresql://test:test@localhost:5432/test", BETTER_AUTH_SECRET: "a-secret-with-more-than-thirty-two-characters", PUBLIC_BASE_URL: "http://localhost:4000" });
    const db = createDb(config.DATABASE_URL);
    const app = await buildApp(config, db);
    app.get("/api/test-rate-limit", { config: { rateLimit: { max: 1, timeWindow: "1 minute" } } }, async () => ({}));
    app.get("/api/test-client-error", async () => { throw Object.assign(new Error("private framework details"), { statusCode: 418 }); });
    try {
      const invalid = await app.inject({ method: "POST", url: "/api/damage", payload: { attacker: { species: "Pikachu", level: 101 }, defender: { species: "Charizard" }, move: "Thunderbolt" } });
      expect(invalid.statusCode).toBe(400);
      expect(apiErrorResponseSchema.parse(invalid.json()).issues).toContainEqual({ code: "validation-failed", path: ["attacker", "level"], rule: "maximum", maximum: 100 });
      const total = await app.inject({ method: "POST", url: "/api/damage", payload: { attacker: { species: "Pikachu", evs: { hp: 252, atk: 252, def: 252 } }, defender: { species: "Charizard" }, move: "Thunderbolt" } });
      expect(total.statusCode).toBe(400);
      expect(apiErrorResponseSchema.parse(total.json()).issues).toContainEqual({ code: "validation-failed", path: ["attacker", "evs"], rule: "ev-total", maximum: 510 });
      const tooLarge = await app.inject({ method: "POST", url: "/api/damage", headers: { "content-type": "application/json" }, payload: "x".repeat(1_048_577) });
      expect(tooLarge.statusCode).toBe(413);
      expect(apiErrorResponseSchema.parse(tooLarge.json()).code).toBe("body-too-large");
      const unsupported = await app.inject({ method: "POST", url: "/api/damage", headers: { "content-type": "application/xml" }, payload: "<data/>" });
      expect(unsupported.statusCode).toBe(415);
      expect(apiErrorResponseSchema.parse(unsupported.json()).code).toBe("unsupported-media-type");
      const missing = await app.inject("/api/no-such-route");
      expect(missing.statusCode).toBe(404);
      expect(apiErrorResponseSchema.parse(missing.json()).code).toBe("not-found");
      const client = await app.inject("/api/test-client-error");
      expect(client.statusCode).toBe(418);
      expect(apiErrorResponseSchema.parse(client.json())).toEqual({ error: "Request failed", code: "request-failed" });
      await app.inject("/api/test-rate-limit");
      const limited = await app.inject("/api/test-rate-limit");
      expect(limited.statusCode).toBe(429);
      expect(apiErrorResponseSchema.parse(limited.json()).code).toBe("rate-limited");
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
