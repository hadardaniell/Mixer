import { buildApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

try {
  const app = await buildApp();
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`[api] listening on http://${HOST}:${PORT}`);
} catch (err) {
  console.error('[api] failed to start', err);
  process.exit(1);
}
