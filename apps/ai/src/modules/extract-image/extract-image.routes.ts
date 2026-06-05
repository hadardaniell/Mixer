import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ExtractFromImageInputSchema, ExtractFromTextResultSchema } from '@mixer/contracts';
import { extractRecipeFromImages } from './extract-image.service.js';

export const extractImageRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/extract/image',
    {
      schema: {
        body: ExtractFromImageInputSchema,
        response: { 200: ExtractFromTextResultSchema },
        tags: ['extract'],
      },
    },
    async (req) => {
      return extractRecipeFromImages(req.body.images);
    },
  );
};
