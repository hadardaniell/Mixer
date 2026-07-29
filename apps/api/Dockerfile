# syntax=docker/dockerfile:1
#
# Multi-stage image for the @mixer/api service (Fastify + MongoDB + Firebase).
# Build context is the REPO ROOT (it's a pnpm workspace that shares the
# @mixer/contracts package), so build with:  docker build -f apps/api/Dockerfile .

# --- base: node 20 (per .nvmrc) with pnpm via corepack ---
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /app

# --- deps: install the whole workspace EXCEPT the mobile app ---
# (.npmrc pins node-linker=hoisted, so this yields one flat node_modules that
#  also carries the deps the ai/api code imports via hoisting.)
FROM base AS deps
# yt-dlp-exec's preinstall probes for a `python` binary during install.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python-is-python3 \
 && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
COPY apps/ai/package.json apps/ai/
COPY apps/mobile/package.json apps/mobile/
RUN pnpm install --frozen-lockfile --filter "!@mixer/mobile"

# --- build: compile contracts, then the api ---
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @mixer/contracts build && pnpm --filter @mixer/api build

# --- runtime: only what's needed to run ---
FROM base AS runtime
# No ENV PORT here on purpose: the platform injects it (Cloud Run sends 8080),
# and server.ts falls back to 3000 locally. docker-compose sets it explicitly.
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
# pnpm links workspace deps into the CONSUMER's node_modules (apps/api/node_modules/@mixer/…),
# which isn't copied above — recreate the link so `import '@mixer/contracts'` resolves.
RUN mkdir -p apps/api/node_modules/@mixer \
 && ln -s /app/packages/contracts apps/api/node_modules/@mixer/contracts
# cwd = apps/api so the Firebase plugin finds firebase-service-account.json
# (provided at runtime via a volume mount / mounted secret — never baked in).
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/server.js"]
