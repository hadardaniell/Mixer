# Mixer

A Hebrew-first recipe app that turns social-media videos, images, and text into structured recipes via AI.

## Monorepo Layout

```
mixer/
├── apps/
│   ├── api/       — @mixer/api    — Fastify, public, mobile talks to this
│   ├── ai/        — @mixer/ai     — Fastify, private, called only by api
│   └── mobile/    — @mixer/mobile — React Native (Expo)
└── packages/
    └── contracts/ — @mixer/contracts — shared zod schemas + TS types
                    imported by api, ai, AND mobile
```

## Prerequisites

- Node.js 20+ (`.nvmrc`)
- pnpm 9+ (`corepack enable && corepack prepare pnpm@9.12.0 --activate`)

## Quickstart

```bash
pnpm install
pnpm typecheck             # all four workspaces compile

# In one terminal — all three apps at once:
pnpm dev
# or one at a time:
pnpm dev:api               # API on :3000
pnpm dev:ai                # AI  on :3001
pnpm dev:mobile            # Expo dev server
```

## Hello-world smoke test

```bash
curl http://localhost:3000/hello   # { "message": "hello from api" }
curl http://localhost:3001/health  # { "ok": true }
```

In the mobile app: tap "Say hello" → the response from the API renders on screen.
The `HelloResponse` type used on both sides comes from `@mixer/contracts`.

## What's NOT here yet

This is the skeleton. Coming in later sessions:

- MongoDB + data models
- Auth (JWT, OAuth)
- The imports flow (URL/image/text → recipe)
- OpenAI integration (Whisper, GPT-4o, embeddings)
- yt-dlp / social-media scraping
- Background job runner
- Docker setup
- Tests
- CI/CD
