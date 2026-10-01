FROM node:25-bookworm-slim AS build
WORKDIR /work
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
COPY apps/web apps/web
RUN pnpm --filter @pokemon-tools/api db:generate && pnpm build

FROM node:25-bookworm-slim
ENV NODE_ENV=production PORT=4000 STATIC_DIR=/app/web
WORKDIR /app
RUN corepack enable && groupadd -r pokemon && useradd -r -g pokemon pokemon
COPY --from=build /work /app
RUN chown -R pokemon:pokemon /app
USER pokemon
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
