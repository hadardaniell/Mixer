// apps/api/src/modules/categories/categories.routes.ts
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { toCategory } from './categories.mapper.js';

export const categoriesRoutes: FastifyPluginAsyncZod = async (app) => {
  // Public: the chip list is reference data, shown before auth on the feed.
  app.get(
    '/categories',
    { schema: { tags: ['categories'] } },
    async () => {
      const items = await app.collections.categories
        .find({ isActive: true }, { sort: { order: 1 } })
        .toArray();
      return { items: items.map(toCategory) };
    },
  );
};
