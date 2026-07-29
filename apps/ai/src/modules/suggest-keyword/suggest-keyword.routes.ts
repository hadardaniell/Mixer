import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { generateRecipeKeyword } from './suggest-keyword.service.js';

const SuggestKeywordSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  ingredients: z.array(z.object({ name: z.string() })).optional(),
});

export const suggestKeywordRoutes: FastifyPluginAsync = async (app) => {
  app.post('/suggest-keyword', async (req, reply) => {
    const parsed = SuggestKeywordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid input schema' });
    }

    const keyword = await generateRecipeKeyword(parsed.data);

    return { keyword };
  });
};