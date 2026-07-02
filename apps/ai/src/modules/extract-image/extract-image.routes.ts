import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ExtractFromImageInputSchema, ExtractFromTextResultSchema } from '@mixer/contracts';
import { extractRecipeFromImages } from './extract-image.service.js';

export const extractImageRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/extract/image',
    {
      schema: {
        body: ExtractFromImageInputSchema,
        response: {
          200: ExtractFromTextResultSchema,
          422: z.object({ error: z.string() }),
        },
        tags: ['extract'],
      },
    },
    async (req, reply) => {
      try {
        return await extractRecipeFromImages(req.body.images);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === 'not_a_recipe') {
            return reply.code(422).send({ error: 'The image does not appear to contain a recipe.' });
          }
          if (err.message === 'images_not_same_recipe') {
            return reply.code(422).send({ error: 'The images do not all belong to the same recipe.' });
          }
        }
        throw err;
      }
    },
  );
};
