import Fastify, { type FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { healthRoute } from './routes/health.js';
import { extractTextRoutes } from './modules/extract-text/extract-text.routes.js';
import { extractImageRoutes } from './modules/extract-image/extract-image.routes.js';
import { embedRoutes } from './modules/embed/embed.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  // `warn`: silence Fastify's startup ("Server listening at…") and per-request
  // info logs; real warnings/errors still surface. Startup banner is printed in server.ts.
  const app = Fastify({
    logger: { level: 'warn' },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.addHook('onSend', async (_req, reply) => {
    reply.header('access-control-allow-origin', '*');
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Mixer AI Service',
        version: '0.0.0',
      },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  await app.register(healthRoute);
  await app.register(extractTextRoutes);
  await app.register(extractImageRoutes);
  await app.register(embedRoutes);

  return app;
}
