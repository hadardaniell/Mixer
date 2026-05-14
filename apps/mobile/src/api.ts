import {
  HelloResponseSchema,
  HealthResponseSchema,
  type HelloResponse,
  type HealthResponse,
} from '@mixer/contracts';

/**
 * Base URLs for our two backends.
 *
 *   API service  → general app API (talks to the mobile client)        :3000
 *   AI  service  → AI orchestrator (extract / embeddings / search)     :3001
 *
 * On a physical device, `localhost` resolves to the phone itself, not your
 * dev machine — override these with your LAN IP:
 *   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.42:3000 \
 *   EXPO_PUBLIC_AI_BASE_URL=http://192.168.1.42:3001  pnpm dev:mobile
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const AI_BASE_URL = process.env.EXPO_PUBLIC_AI_BASE_URL ?? 'http://localhost:3001';

export async function fetchHello(): Promise<HelloResponse> {
  const res = await fetch(`${API_BASE_URL}/hello`);
  if (!res.ok) {
    throw new Error(`api /hello returned ${res.status}`);
  }
  return HelloResponseSchema.parse(await res.json());
}

export async function fetchAiHealth(): Promise<HealthResponse> {
  const res = await fetch(`${AI_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`ai /health returned ${res.status}`);
  }
  return HealthResponseSchema.parse(await res.json());
}
