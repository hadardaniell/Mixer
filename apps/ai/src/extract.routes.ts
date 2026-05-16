import type { FastifyInstance } from 'fastify';
import { downloadService } from './download.service.js';
import { videoLlamaService } from './videoLlama.service.js';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function extractRoutes(app: FastifyInstance) {
  app.post('/extract/video', async (req, reply) => {
    const { url } = req.body as { url: string };
    
    let mediaPath = '';
    try {
      // 1. Download the video
      mediaPath = await downloadService.download(url);
      app.log.info({ mediaPath }, 'Video downloaded successfully');

      // 2. Have Gemini watch it and output JSON
      const recipeData = await videoLlamaService.extractRecipe(mediaPath);
      
      return reply.code(200).send(recipeData);
    } catch (err) {
      app.log.error(err, 'Extraction failed');
      return reply.code(500).send({ error: 'Failed to process video in AI service', details: err instanceof Error ? err.message : String(err) });
    } finally {
      if (mediaPath) {
        await fs.rm(path.dirname(mediaPath), { recursive: true, force: true }).catch(() => {});
      }
    }
  });
}