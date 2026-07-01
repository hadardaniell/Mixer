import { buildApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';
const DISPLAY_HOST = HOST === '0.0.0.0' ? 'localhost' : HOST;

try {
  const app = await buildApp();
  await app.listen({ port: PORT, host: HOST });
  console.log(`✅ API ready on   http://${DISPLAY_HOST}:${PORT}`);
  console.log(`📚 Swagger docs   http://${DISPLAY_HOST}:${PORT}/docs`);
} catch (err) {
  console.error('[api] failed to start', err);
  process.exit(1);
}
