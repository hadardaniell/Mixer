import type { FastifyInstance } from 'fastify';
import { HealthResponseSchema } from '@mixer/contracts';

export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get(
    '/health',
    {
      schema: {
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    async () => ({ ok: true }),
  );
}
