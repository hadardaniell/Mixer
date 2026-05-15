import Fastify, { type FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { helloRoute } from './routes/hello.js';
import { mongoPlugin } from './plugins/mongo.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { recipesRoutes } from './modules/recipes/recipes.routes.js';
import { recipeBooksRoutes } from './modules/recipe-books/recipe-books.routes.js';
import { favoritesRoutes } from './modules/favorites/favorites.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.addHook('onSend', async (_req, reply) => {
    reply.header('access-control-allow-origin', '*');
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Mixer API',
        version: '0.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  await mongoPlugin(app);
  await authPlugin(app);

  await app.register(helloRoute);
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(recipesRoutes);
  await app.register(recipeBooksRoutes);
  await app.register(favoritesRoutes);

  return app;
}
