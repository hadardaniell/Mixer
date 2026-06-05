import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ExtractFromTextInputSchema, ExtractFromTextResultSchema } from '@mixer/contracts';
import { extractRecipeFromText } from './extract-text.service.js';

export const extractTextRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/extract/text',
    {
      schema: {
        body: ExtractFromTextInputSchema,
        response: { 200: ExtractFromTextResultSchema },
        tags: ['extract'],
      },
    },
    async (req) => {
      return extractRecipeFromText(req.body.text);
    },
  );
};
