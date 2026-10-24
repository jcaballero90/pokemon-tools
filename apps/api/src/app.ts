import Fastify from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import staticFiles from "@fastify/static";
import { z } from "zod";
import { resolve } from "node:path";
import {
  apiErrorResponseSchema, catalogResponseSchema, damageRequestSchema, damageResponseSchema,
  evolutionResponseSchema, pokedexMovesResponseSchema, pokedexResponseSchema, savedTeamResponseSchema, savedTeamsResponseSchema,
  teamInputSchema, typeChartResponseSchema
} from "@pokemon-tools/contracts";
import { createAuth, isValidUsername } from "./modules/auth/auth.js";
import { catalog, typeChart } from "./modules/catalog/catalog.js";
import { pokedex, pokedexEvolution } from "./modules/catalog/pokeapi-adapter.js";
import { pokedexMoves } from "./modules/catalog/pokedex-moves.js";
import { eligiblePokedexSlugs, pokedexIdentityBySlug } from "./modules/catalog/pokedex-identities.js";
import { computeDamage } from "./modules/damage/damage.js";
import { deleteTeam, listTeams, saveTeam, updateTeam, validateTeam, validateTeamIssues } from "./modules/teams/teams.js";
import { PrismaTeamStore } from "./modules/teams/prisma-adapter.js";
import { inCidr } from "./ingress.js";
import { apiError, fastifyValidationIssues, InputValidationError, zodValidationIssues } from "./http-errors.js";
import { errorText } from "./resources/errors.js";
import { apiLoggerOptions } from "./logger.js";
import { hasTrustedOrigin, trustedOriginSet } from "./origins.js";
import type { Config } from "./config.js";
import type { Database } from "./db.js";

export async function buildApp(config: Config, db: Database) {
  const app = Fastify({
    logger: apiLoggerOptions,
    trustProxy: (address) => Boolean(config.EDGE_CIDR && inCidr(address, config.EDGE_CIDR))
  });
  app.addHook("onRequest", async (request, reply) => {
    const peer = request.raw.socket.remoteAddress ?? "";
    if (config.EDGE_CIDR && !inCidr(peer, config.EDGE_CIDR)) return reply.code(403).send(apiError("untrusted-ingress"));
    if (!config.EDGE_CIDR && config.NODE_ENV !== "development" && config.NODE_ENV !== "test") return reply.code(503).send(apiError("ingress-not-configured"));
  });
  await app.register(helmet, { contentSecurityPolicy: { directives: { imgSrc: ["'self'", "data:", "https://raw.githubusercontent.com/PokeAPI/sprites/", "https://archives.bulbagarden.net", "https://assets.dittobase.com/"] } } });
  await app.register(rateLimit, { max: config.NODE_ENV === "test" ? 1_000 : 120, timeWindow: "1 minute" });
  await app.register(swagger, { openapi: { info: { title: "Pokémon Tools API", version: "0.1.0" }, components: { securitySchemes: { cookieAuth: { type: "apiKey", in: "cookie", name: "better-auth.session_token" } } } } });
  if (config.DEPLOY_ENV !== "production") await app.register(swaggerUi, { routePrefix: "/docs" });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof InputValidationError) return reply.code(400).send(apiError(error.code, error.message, error.issues));
    if (!(error instanceof Error)) {
      request.log.error({ errorName: "UnknownError" }, errorText.unexpectedRequestFailure);
      return reply.code(500).send(apiError("internal-error"));
    }
    const statusCode = "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
    const status = statusCode >= 400 && statusCode < 500 ? statusCode : 500;
    if (status >= 500) {
      const name = error.name && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(error.name) ? error.name : "Error";
      request.log.error({ errorName: name }, errorText.unexpectedRequestFailure);
      return reply.code(status).send(apiError("internal-error"));
    }
    const code = status === 413 ? "body-too-large"
      : status === 415 ? "unsupported-media-type"
      : "validation" in error ? "validation-failed"
      : status === 404 ? "not-found"
      : status === 429 ? "rate-limited" : "request-failed";
    const issues = "validation" in error && Array.isArray(error.validation) ? fastifyValidationIssues(error.validation) : undefined;
    return reply.code(status).send(apiError(code, undefined, issues));
  });
  const auth = createAuth(db, config);
  const teamStore = new PrismaTeamStore(db);
  const trustedOrigins = trustedOriginSet(config.PUBLIC_BASE_URL, config.TRUSTED_ORIGINS);
  app.route({ method: ["GET", "POST"], url: "/api/auth/*", handler: async (request, reply) => {
    const url = new URL(request.url, `${request.protocol}://${request.hostname}`);
    if (url.pathname === "/api/auth/sign-up/email") {
      const username = request.body && typeof request.body === "object" && "username" in request.body
        ? (request.body as { username?: unknown }).username
        : undefined;
      if (!isValidUsername(username)) {
        return reply.code(400).send({ code: "INVALID_USERNAME", message: "Username must contain 3–30 letters, numbers, underscores or periods." });
      }
    }
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
  app.get("/api/health", { schema: { tags: ["operations"], response: { 200: { type: "object", required: ["status"], properties: { status: { type: "string" } }, additionalProperties: false } } } }, async () => ({ status: "ok" }));
  app.get("/api/site-config", { schema: { tags: ["operations"], summary: "Public site metadata configuration" } }, async () => ({ publicBaseUrl: config.PUBLIC_BASE_URL, deployEnv: config.DEPLOY_ENV }));
  app.get("/sitemap.xml", async (_request, reply) => {
    const siteBase = new URL(config.PUBLIC_BASE_URL);
    const paths = ["/", "/type-chart", "/pokedex", "/team-builder", "/damage", "/account", ...eligiblePokedexSlugs().map((slug) => `/pokedex/${slug}`)];
    const urls = paths.map((path) => `<url><loc>${escapeXml(new URL(path, siteBase).toString())}</loc></url>`).join("");
    return reply.header("content-type", "application/xml; charset=utf-8").header("cache-control", "public, max-age=3600").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  });
  app.get("/robots.txt", async (_request, reply) => {
    if (config.DEPLOY_ENV !== "production") return reply.type("text/plain; charset=utf-8").header("cache-control", "public, max-age=300").send("User-agent: *\nDisallow: /\n");
    const sitemap = new URL("/sitemap.xml", config.PUBLIC_BASE_URL).toString();
    return reply.type("text/plain; charset=utf-8").header("cache-control", "public, max-age=3600").send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${sitemap}\n`);
  });
  if (config.DEPLOY_ENV !== "production") app.get("/api/ingress-debug", {
    schema: {
      tags: ["operations"],
      response: {
        200: {
          type: "object",
          properties: {
            rawPeer: { type: "string" }, clientIp: { type: "string" }, protocol: { type: "string" },
            host: { type: "string" }, forwardedFor: { type: "string" }, realIp: { type: "string" }
          }
        }
      }
    }
  }, async (request) => ({
    rawPeer: request.raw.socket.remoteAddress, clientIp: request.ip,
    protocol: request.protocol, host: request.hostname,
    forwardedFor: request.headers["x-forwarded-for"], realIp: request.headers["x-real-ip"]
  }));
  const json = (schema: z.ZodType) => z.toJSONSchema(schema, { target: "draft-7", io: "output" });
  const errors = json(apiErrorResponseSchema);
  app.get("/api/catalog", { schema: { tags: ["catalog"], summary: "Pinned Generation 9 battle catalog", response: { 200: json(catalogResponseSchema) } } }, async () => catalog);
  app.get("/api/type-chart", { schema: { tags: ["catalog"], summary: "Generation 9 type effectiveness", response: { 200: json(typeChartResponseSchema) } } }, async () => typeChart());
  app.get<{ Params: { species: string } }>("/api/pokedex/:species", { schema: { tags: ["catalog"], params: { type: "object", required: ["species"], properties: { species: { type: "string" } } }, response: { 200: json(pokedexResponseSchema), 400: errors, 500: errors } } }, async (request) => pokedex(db, request.params.species));
  app.get<{ Params: { species: string } }>("/api/pokedex/:species/moves", { schema: { tags: ["catalog"], summary: "Scarlet/Violet moves and acquisition methods for one Pokédex entry", params: { type: "object", required: ["species"], properties: { species: { type: "string" } } }, response: { 200: json(pokedexMovesResponseSchema), 400: errors, 500: errors } } }, async (request) => pokedexMoves(request.params.species));
  app.get<{ Params: { species: string } }>("/api/pokedex/:species/evolution", { schema: { tags: ["catalog"], summary: "Official evolution family and Mega forms", params: { type: "object", required: ["species"], properties: { species: { type: "string" } } }, response: { 200: json(evolutionResponseSchema), 400: errors, 500: errors } } }, async (request) => pokedexEvolution(db, request.params.species));
  app.post("/api/damage", { schema: { tags: ["damage"], body: z.toJSONSchema(damageRequestSchema, { target: "draft-7", io: "input" }), response: { 200: json(damageResponseSchema), 400: errors, 500: errors }, summary: "Damage range and one-hit KO chance conditional on a hit" } }, async (request, reply) => {
    const parsed = damageRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send(apiError("validation-failed", parsed.error.flatten(), zodValidationIssues(parsed.error.issues)));
    return computeDamage(parsed.data);
  });
  app.get("/api/me/teams", { schema: { tags: ["teams"], security: [{ cookieAuth: [] }], response: { 200: json(savedTeamsResponseSchema), 401: errors, 500: errors } } }, async (request, reply) => {
    const owner = await userId(request);
    if (!owner) return reply.code(401).send(apiError("sign-in-required"));
    return listTeams(teamStore, owner);
  });
  app.post("/api/me/teams", { schema: { tags: ["teams"], security: [{ cookieAuth: [] }], body: z.toJSONSchema(teamInputSchema, { target: "draft-7", io: "input" }), response: { 201: json(savedTeamResponseSchema), 400: errors, 401: errors, 403: errors, 500: errors } } }, async (request, reply) => {
    if (!hasTrustedOrigin(request.headers.origin, trustedOrigins)) return reply.code(403).send(apiError("untrusted-origin"));
    const owner = await userId(request);
    if (!owner) return reply.code(401).send(apiError("sign-in-required"));
    const parsed = teamInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send(apiError("validation-failed", parsed.error.flatten(), zodValidationIssues(parsed.error.issues)));
    const errors = validateTeam(parsed.data);
    if (errors.length) return reply.code(400).send(apiError("validation-failed", errors, validateTeamIssues(parsed.data)));
    return reply.code(201).send(await saveTeam(teamStore, owner, parsed.data));
  });
  app.put<{ Params: { id: string } }>("/api/me/teams/:id", { schema: { tags: ["teams"], security: [{ cookieAuth: [] }], params: { type: "object", required: ["id"], properties: { id: { type: "string", minLength: 1 } } }, body: z.toJSONSchema(teamInputSchema, { target: "draft-7", io: "input" }), response: { 200: json(savedTeamResponseSchema), 400: errors, 401: errors, 403: errors, 404: errors, 500: errors } } }, async (request, reply) => {
    if (!hasTrustedOrigin(request.headers.origin, trustedOrigins)) return reply.code(403).send(apiError("untrusted-origin"));
    const owner = await userId(request);
    if (!owner) return reply.code(401).send(apiError("sign-in-required"));
    const parsed = teamInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send(apiError("validation-failed", parsed.error.flatten(), zodValidationIssues(parsed.error.issues)));
    const errors = validateTeam(parsed.data);
    if (errors.length) return reply.code(400).send(apiError("validation-failed", errors, validateTeamIssues(parsed.data)));
    const updated = await updateTeam(teamStore, owner, request.params.id, parsed.data);
    return updated ? reply.code(200).send(updated) : reply.code(404).send(apiError("team-not-found"));
  });
  app.delete<{ Params: { id: string } }>("/api/me/teams/:id", { schema: { tags: ["teams"], security: [{ cookieAuth: [] }], params: { type: "object", required: ["id"], properties: { id: { type: "string", minLength: 1 } } }, response: { 204: { type: "null" }, 401: errors, 403: errors, 404: errors, 500: errors } } }, async (request, reply) => {
    if (!hasTrustedOrigin(request.headers.origin, trustedOrigins)) return reply.code(403).send(apiError("untrusted-origin"));
    const owner = await userId(request);
    if (!owner) return reply.code(401).send(apiError("sign-in-required"));
    const removed = await deleteTeam(teamStore, owner, request.params.id);
    return removed ? reply.code(204).send() : reply.code(404).send(apiError("team-not-found"));
  });
  if (config.STATIC_DIR) {
    await app.register(staticFiles, { root: resolve(config.STATIC_DIR), prefix: "/" });
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/")) return reply.code(404).send(apiError("not-found"));
      const pathname = new URL(request.url, "http://localhost").pathname;
      const isPage = ["/", "/type-chart", "/pokedex", "/team-builder", "/damage", "/account"].includes(pathname);
      const entryPath = pathname.match(/^\/pokedex\/([^/]+)\/?$/);
      let validEntry = false;
      if (entryPath?.[1]) {
        try { validEntry = Boolean(pokedexIdentityBySlug(decodeURIComponent(entryPath[1]))); } catch { validEntry = false; }
      }
      if (isPage || validEntry || entryPath) return reply.code(entryPath && !validEntry ? 404 : 200).type("text/html; charset=utf-8").sendFile("index.html");
      return reply.code(404).type("text/plain; charset=utf-8").send("Not found");
    });
  } else {
    app.setNotFoundHandler((_request, reply) => reply.code(404).send(apiError("not-found")));
  }
  return app;
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[character] ?? character);
}
