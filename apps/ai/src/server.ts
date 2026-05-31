import { buildApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

const app = await buildApp();

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`[ai] listening on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
