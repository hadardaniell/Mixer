import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { generateRecipeImage } from './generate-image.service.js';

const GenerateImageSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  ingredients: z.array(z.object({ name: z.string() })).optional(),
  steps: z.array(z.object({ text: z.string() })).optional(),
  tags: z.array(z.string()).optional(),
});

export const generateImageRoutes: FastifyPluginAsync = async (app) => {
  app.post('/generate-image', async (req, reply) => {
    const parsed = GenerateImageSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid input schema' });
    }

    try {
      const image = await generateRecipeImage(parsed.data);
      return { data: image.data, mimeType: image.mimeType };
    } catch (err) {
      req.log.warn({ err }, '[generate-image] generation failed');
      // The API falls back to stock search on a non-2xx, so this is not fatal.
      return reply.code(502).send({ error: (err as Error).message });
    }
  });
};
