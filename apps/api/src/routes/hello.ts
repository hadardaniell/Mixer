import type { FastifyInstance } from 'fastify';
import { HelloResponseSchema } from '@mixer/contracts';

/**
 * GET /hello
 *
 * Returns a hello-world payload that conforms to HelloResponseSchema
 * from @mixer/contracts. The same schema is consumed by the mobile client
 * to validate this response — proving the shared-contracts wiring works.
 */
export async function helloRoute(app: FastifyInstance): Promise<void> {
  app.get(
    '/hello',
    {
      schema: {
        response: {
          200: HelloResponseSchema,
        },
      },
    },
    async () => {
      return { message: 'hello from api' };
    },
  );
}
