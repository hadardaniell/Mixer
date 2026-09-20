// apps/api/src/app.ts
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
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
import { categoriesRoutes } from './modules/categories/categories.routes.js';
import { friendsRoutes } from './modules/friendships/friendships.routes.js';
import { utilsRoutes } from './modules/utils/utils.routes.js';
import { sharesRoutes } from './modules/shares/shares.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { feedRoutes } from './modules/feed/feed.routes.js';
import { invalidateFeed } from './modules/feed/feed.cache.js';

/**
 * POSTs that only read. They take a body because the id list is too long for a
 * query string, not because they change anything — and the home screen calls
 * them on every visit, so treating them as writes would clear the feed cache
 * about as often as it was filled.
 */
const READ_ONLY_POSTS = new Set(['/recipes/by-ids', '/users/by-ids']);
import { notificationService } from './services/notification.service.js';
import multipart from '@fastify/multipart';
import firebasePlugin from './plugins/firebase.js';

export async function buildApp(): Promise<FastifyInstance> {
  // `warn`: silence Fastify's startup ("Server listening at…") and per-request
  // info logs; real warnings/errors still surface. Startup banner is printed in server.ts.
  const app = Fastify({ logger: { level: 'warn' } }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  await app.register(multipart);
  await app.register(firebasePlugin);

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  await mongoPlugin(app);
  notificationService.init(app.collections);
  await authPlugin(app);

  // Any successful write by a signed-in user can change what their home feed
  // shows, and enumerating which routes those are is a list that would rot. One
  // hook covers every mutation instead — including ones added later.
  //
  // It only clears the *acting* user. A write that changes someone else's feed
  // (a friend adding a recipe to a shared book) is left to the cache's TTL.
  app.addHook('onResponse', async (req, reply) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return;
    if (reply.statusCode >= 400) return;
    if (READ_ONLY_POSTS.has(req.routeOptions.url ?? '')) return;
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (userId) invalidateFeed(userId);
  });

  await app.register(helloRoute);
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(recipesRoutes);
  await app.register(recipeBooksRoutes);
  await app.register(favoritesRoutes);
  await app.register(categoriesRoutes);
  await app.register(friendsRoutes, { prefix: '/friends' });
  await app.register(utilsRoutes, { prefix: '/utils' });
  await app.register(sharesRoutes);
  await app.register(notificationsRoutes);
  await app.register(feedRoutes);

  return app;
}
