# syntax=docker/dockerfile:1
#
# Multi-stage image for the @mixer/ai service (Fastify + Groq/Gemini + OCR +
# video download via yt-dlp/ffmpeg). Build context is the REPO ROOT:
#   docker build -f apps/ai/Dockerfile .

# --- base: node 20 with pnpm via corepack ---
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /app

# --- deps: install the whole workspace EXCEPT the mobile app ---
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

# --- build: compile contracts, then the ai service ---
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/ai apps/ai
RUN pnpm --filter @mixer/contracts build && pnpm --filter @mixer/ai build

# --- runtime ---
FROM base AS runtime
# No ENV PORT here on purpose: the platform injects it (Cloud Run sends 8080),
# and server.ts falls back to 3001 locally. docker-compose sets it explicitly.
ENV NODE_ENV=production
# ffmpeg for video processing, python3 for yt-dlp at runtime.
# (The yt-dlp binary itself ships inside the yt-dlp-exec node module.)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates python3 python-is-python3 \
 && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=build /app/apps/ai/package.json ./apps/ai/package.json
COPY --from=build /app/apps/ai/dist ./apps/ai/dist
# pnpm links workspace deps into the CONSUMER's node_modules (apps/ai/node_modules/@mixer/…),
# which isn't copied above — recreate the link so `import '@mixer/contracts'` resolves.
RUN mkdir -p apps/ai/node_modules/@mixer \
 && ln -s /app/packages/contracts apps/ai/node_modules/@mixer/contracts
WORKDIR /app/apps/ai
EXPOSE 3001
CMD ["node", "dist/server.js"]
