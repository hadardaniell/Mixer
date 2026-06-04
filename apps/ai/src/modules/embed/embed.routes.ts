import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  EmbedRecipeInputSchema,
  EmbedQueryInputSchema,
  EmbedResponseSchema,
} from '@mixer/contracts';
import { embedRecipe, embedQuery } from './embed.service.js';

export const embedRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/embed/recipe',
    {
      schema: {
        body: EmbedRecipeInputSchema,
        response: { 200: EmbedResponseSchema },
        tags: ['embed'],
      },
    },
    async (req) => {
      const embedding = await embedRecipe(req.body);
      return { embedding };
    },
  );

  app.post(
    '/embed/query',
    {
      schema: {
        body: EmbedQueryInputSchema,
        response: { 200: EmbedResponseSchema },
        tags: ['embed'],
      },
    },
    async (req) => {
      const embedding = await embedQuery(req.body.query);
      return { embedding };
    },
  );
};
