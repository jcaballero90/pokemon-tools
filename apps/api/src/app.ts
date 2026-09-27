import Fastify from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import staticFiles from "@fastify/static";
import { z } from "zod";
import { resolve } from "node:path";
import { damageRequestSchema, teamInputSchema } from "@pokemon-tools/contracts";
import { createAuth } from "./modules/auth/auth.js";
import { catalog, typeChart } from "./modules/catalog/catalog.js";
import { pokedex } from "./modules/catalog/pokeapi-adapter.js";
import { computeDamage } from "./modules/damage/damage.js";
import { deleteTeam, listTeams, saveTeam, validateTeam } from "./modules/teams/teams.js";
import { PrismaTeamStore } from "./modules/teams/prisma-adapter.js";
import { proTeams } from "./modules/pro-teams/pro-teams.js";
import { inCidr } from "./ingress.js";
import type { Config } from "./config.js";
import type { Database } from "./db.js";

export async function buildApp(config: Config, db: Database) {
  const app = Fastify({
    logger: true,
    trustProxy: (address) => Boolean(config.EDGE_CIDR && inCidr(address, config.EDGE_CIDR))
  });
  app.addHook("onRequest", async (request, reply) => {
    const peer = request.raw.socket.remoteAddress ?? "";
    if (config.EDGE_CIDR && !inCidr(peer, config.EDGE_CIDR)) return reply.code(403).send({ error: "Untrusted ingress" });
    if (!config.EDGE_CIDR && config.NODE_ENV !== "development" && config.NODE_ENV !== "test") return reply.code(503).send({ error: "Ingress not configured" });
  });
  await app.register(helmet);
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
  await app.register(swagger, { openapi: { info: { title: "Pokémon Tools API", version: "0.1.0" }, components: { securitySchemes: { cookieAuth: { type: "apiKey", in: "cookie", name: "better-auth.session_token" } } } } });
  if (config.DEPLOY_ENV !== "production") await app.register(swaggerUi, { routePrefix: "/docs" });
  const auth = createAuth(db, config);
  const teamStore = new PrismaTeamStore(db);
  app.route({ method: ["GET", "POST"], url: "/api/auth/*", handler: async (request, reply) => {
    const url = new URL(request.url, `${request.protocol}://${request.hostname}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    const response = await auth.handler(new Request(url, {
      method: request.method, headers,
      body: request.method === "GET" ? undefined : typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {})
    }));
    reply.code(response.status);
    response.headers.forEach((value, key) => reply.header(key, value));
    if (response.headers.getSetCookie().length) reply.header("set-cookie", response.headers.getSetCookie());
    return reply.send(await response.text());
  } });
  async function userId(request: { headers: Record<string, unknown> }) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) if (typeof value === "string") headers.set(key, value);
    return (await auth.api.getSession({ headers }))?.user.id;
  }
  app.get("/api/health", { schema: { tags: ["operations"], response: { 200: { type: "object", properties: { status: { type: "string" } } } } } }, async () => ({ status: "ok" }));
  if (config.DEPLOY_ENV !== "production") app.get("/api/ingress-debug", async (request) => ({
    rawPeer: request.raw.socket.remoteAddress, clientIp: request.ip,
    protocol: request.protocol, host: request.hostname,
    forwardedFor: request.headers["x-forwarded-for"], realIp: request.headers["x-real-ip"]
  }));
  app.get("/api/catalog", { schema: { tags: ["catalog"], summary: "Pinned Generation 9 battle catalog" } }, async () => catalog);
  app.get("/api/type-chart", { schema: { tags: ["catalog"], summary: "Generation 9 type effectiveness" } }, async () => typeChart());
  app.get<{ Params: { species: string } }>("/api/pokedex/:species", { schema: { tags: ["catalog"], params: { type: "object", required: ["species"], properties: { species: { type: "string" } } } } }, async (request, reply) => {
    try { return await pokedex(db, request.params.species); }
    catch (error) { return reply.code(400).send({ error: (error as Error).message }); }
  });
  app.post("/api/damage", { schema: { tags: ["damage"], body: z.toJSONSchema(damageRequestSchema, { target: "draft-7", io: "input" }), summary: "Damage range and one-hit KO chance conditional on a hit" } }, async (request, reply) => {
    const parsed = damageRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    try { return computeDamage(parsed.data); }
    catch (error) { return reply.code(400).send({ error: (error as Error).message }); }
  });
  app.get("/api/pro-teams", { schema: { tags: ["pro-teams"], summary: "Credited curated pro teams" } }, async () => proTeams);
  app.get("/api/me/teams", { schema: { tags: ["teams"], security: [{ cookieAuth: [] }] } }, async (request, reply) => {
    const owner = await userId(request);
    if (!owner) return reply.code(401).send({ error: "Sign in required" });
    return listTeams(teamStore, owner);
  });
  app.post("/api/me/teams", { schema: { tags: ["teams"], security: [{ cookieAuth: [] }], body: z.toJSONSchema(teamInputSchema, { target: "draft-7", io: "input" }) } }, async (request, reply) => {
    const owner = await userId(request);
    if (!owner) return reply.code(401).send({ error: "Sign in required" });
    const parsed = teamInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const errors = validateTeam(parsed.data);
    if (errors.length) return reply.code(400).send({ error: errors });
    return reply.code(201).send(await saveTeam(teamStore, owner, parsed.data));
  });
  app.delete<{ Params: { id: string } }>("/api/me/teams/:id", async (request, reply) => {
    const owner = await userId(request);
    if (!owner) return reply.code(401).send({ error: "Sign in required" });
    const removed = await deleteTeam(teamStore, owner, request.params.id);
    return removed ? reply.code(204).send() : reply.code(404).send({ error: "Team not found" });
  });
  if (config.STATIC_DIR) {
    await app.register(staticFiles, { root: resolve(config.STATIC_DIR), prefix: "/" });
    app.setNotFoundHandler((request, reply) => request.url.startsWith("/api/") ? reply.code(404).send({ error: "Not found" }) : reply.sendFile("index.html"));
  }
  return app;
}
