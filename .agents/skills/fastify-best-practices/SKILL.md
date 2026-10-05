---
name: fastify-best-practices
description: "Guides development of Fastify Node.js backend servers and REST APIs using TypeScript or JavaScript. Use when building, configuring, or debugging a Fastify application — including defining routes, implementing plugins, setting up JSON Schema validation, handling errors, optimising performance, managing authentication, configuring CORS and security headers, integrating databases, working with WebSockets, and deploying to production. Covers the full Fastify request lifecycle (hooks, serialization, logging with Pino) and TypeScript integration via strip types. Trigger terms: Fastify, Node.js server, REST API, API routes, backend framework, fastify.config, server.ts, app.ts."
metadata:
  tags: fastify, nodejs, typescript, backend, api, server, http
---

## pokemon-tools project constraints

- Use this skill for Fastify API implementation and review. Follow the repository `AGENTS.md`, accepted requirements, ADRs, and existing architecture when they define project-specific behavior.
- Retain the approved Fastify 5, Zod 4 with `fastify-type-provider-zod`, and `tsc` build. Treat examples using TypeBox, `env-schema`, or Node.js type stripping as alternatives, not reasons to migrate the project.
- Preserve the scoped reverse-proxy trust and edge-peer checks in ADR-005 and the security plan. Do not broaden proxy trust to all peers as a generic configuration change.

## When to use

Use this skill when you need to:
- Develop backend applications using Fastify
- Implement Fastify plugins and route handlers
- Get guidance on Fastify architecture and patterns
- Use TypeScript with Fastify (strip types)
- Implement testing with Fastify's inject method
- Configure validation, serialization, and error handling

## Quick Start

A minimal, runnable Fastify server to get started immediately:

```ts
import Fastify from 'fastify'

const app = Fastify({ logger: true })

app.get('/health', async (request, reply) => {
  return { status: 'ok' }
})

const start = async () => {
  await app.listen({ port: 3000, host: '0.0.0.0' })
}
start()
```

## Recommended Reading Order for Common Scenarios

- **New to Fastify?** Start with `rules/plugins.md` → `rules/routes.md` → `rules/schemas.md`
- **Adding authentication:** `rules/plugins.md` → `rules/hooks.md` → `rules/authentication.md`
- **Improving performance:** `rules/schemas.md` → `rules/serialization.md` → `rules/performance.md`
- **Setting up testing:** `rules/routes.md` → `rules/testing.md`
- **Going to production:** `rules/logging.md` → `rules/configuration.md` → `rules/deployment.md`

## How to use

Read individual rule files for detailed explanations and code examples:

- [rules/plugins.md](rules/plugins.md) - Plugin development and encapsulation
- [rules/routes.md](rules/routes.md) - Route organization and handlers
- [rules/schemas.md](rules/schemas.md) - JSON Schema validation
- [rules/error-handling.md](rules/error-handling.md) - Error handling patterns
- [rules/hooks.md](rules/hooks.md) - Hooks and request lifecycle
- [rules/authentication.md](rules/authentication.md) - Authentication and authorization
- [rules/testing.md](rules/testing.md) - Testing with inject()
- [rules/performance.md](rules/performance.md) - Performance optimization
- [rules/logging.md](rules/logging.md) - Logging with Pino
- [rules/typescript.md](rules/typescript.md) - TypeScript integration
- [rules/decorators.md](rules/decorators.md) - Decorators and extensions
- [rules/content-type.md](rules/content-type.md) - Content type parsing
- [rules/serialization.md](rules/serialization.md) - Response serialization
- [rules/cors-security.md](rules/cors-security.md) - CORS and security headers
- [rules/websockets.md](rules/websockets.md) - WebSocket support
- [rules/database.md](rules/database.md) - Database integration patterns
- [rules/configuration.md](rules/configuration.md) - Application configuration
- [rules/deployment.md](rules/deployment.md) - Production deployment
- [rules/http-proxy.md](rules/http-proxy.md) - HTTP proxying and reply.from()

## Core Principles

- **Encapsulation**: Fastify's plugin system provides automatic encapsulation
- **Schema-first**: Define schemas for validation and serialization
- **Performance**: Fastify is optimized for speed; use its features correctly
- **Async/await**: All handlers and hooks support async functions
- **Minimal dependencies**: Prefer Fastify's built-in features and official plugins

## Upstream provenance

- Source: https://github.com/mcollina/skills/tree/856efd268ae85482d882f3d0bed869fd020b5c06/skills/fastify
- Upstream revision: `856efd268ae85482d882f3d0bed869fd020b5c06`
- Retrieved: 2026-10-03
