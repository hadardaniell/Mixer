import fs from 'node:fs/promises';
import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ExtractFromTextInputSchema, ExtractFromTextResultSchema } from '@mixer/contracts';
import { extractRecipeFromText } from './extract.service.js';
import { downloadService } from '../../download.service.js';
import { videoLlamaService } from '../../videoLlama.service.js';

export const extractRoutes: FastifyPluginAsyncZod = async (app) => {
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

  app.post(
    '/extract/video',
    {
      schema: {
        body: z.object({ url: z.string().url() }),
      },
    },
    async (req, reply) => {
      const { url } = req.body;
      let tempDirectory: string | undefined;

      try {
        app.log.info(`[extract/video] Starting download and frame extraction for: ${url}`);
        
        // 1. Download video and extract frames & audio
        const { tempDir, audioPath, framePaths } = await downloadService.downloadAndExtractFrames(url);
        tempDirectory = tempDir; // Save reference for cleanup

        app.log.info(`[extract/video] Processing frames and audio with Video AI`);
        
        // 2. Extract recipe via Gemini
        const recipe = await videoLlamaService.extractRecipe(audioPath, framePaths);

        return reply.send(recipe);
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({ error: 'Failed to process video' });
      } finally {
        // 3. Cleanup: Always ensure the temp directory with the video/frames is deleted
        if (tempDirectory) {
          await fs.rm(tempDirectory, { recursive: true, force: true }).catch(err => {
            app.log.error(`[extract/video] Failed to cleanup temp directory ${tempDirectory}: ${err}`);
          });
        }
      }
    }
  );
};
