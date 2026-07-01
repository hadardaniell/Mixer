import { buildApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';
const DISPLAY_HOST = HOST === '0.0.0.0' ? 'localhost' : HOST;

const app = await buildApp();

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`✅ AI ready on    http://${DISPLAY_HOST}:${PORT}`);
  console.log(`📚 Swagger docs   http://${DISPLAY_HOST}:${PORT}/docs`);
} catch (err) {
  console.error('[ai] failed to start', err);
  process.exit(1);
}
