// apps/ai/src/modules/translate/translate.routes.ts
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { translateRecipeWithGemini } from './translate.service.js';

const TranslateRecipeSchema = z.object({
  recipe: z.object({
    title: z.string(),
    description: z.string().optional(),
    ingredients: z.array(
      z.object({
        name: z.string(),
        amount: z.number().optional(),
        unit: z.string().optional(),
        note: z.string().optional(),
      })
    ),
    steps: z.array(
      z.object({
        order: z.number(),
        text: z.string(),
        durationMinutes: z.number().optional(),
      })
    ),
  }),
  targetLanguage: z.enum(['he', 'en']),
});

export const translateRoutes: FastifyPluginAsync = async (app) => {
  app.post('/translate/recipe', async (req, reply) => {
    try {
      const { recipe, targetLanguage } = TranslateRecipeSchema.parse(req.body);
      const translated = await translateRecipeWithGemini(recipe, targetLanguage);
      return reply.code(200).send(translated);
    } catch (error) {
      app.log.error(error, '[Translate] Error translating recipe');
      return reply.code(500).send({ error: 'Failed to translate recipe' });
    }
  });
};