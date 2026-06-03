import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ExtractFromTextInputSchema, ExtractFromTextResultSchema } from '@mixer/contracts';
import { extractRecipeFromText } from './extract.service.js';
import { downloadService } from '../../download.service.js';
import { textLlamaService } from '../../textLlama.service.js';
import { videoLlamaService } from '../../videoLlama.service.js';
import fs from 'node:fs/promises';
import { z } from 'zod';

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
        tags: ['extract'],
      },
    },
    async (req, reply) => {
      const { url } = req.body;
      
      let tempDirectory = '';
      try {
        app.log.info({ url }, 'Attempting to extract recipe from video comments...');

        if (typeof downloadService.getTopComments !== 'function') {
          app.log.error({ availableMethods: Object.keys(downloadService) }, 'CRITICAL ERROR: Loaded old downloadService instead of the new one!');
        }

        const commentsText = await downloadService.getTopComments(url);
        
        if (commentsText && commentsText.trim()) {
          console.log('\n======================================================');
          console.log('💬 [Top Comments Extracted]');
          console.log(commentsText);
          console.log('======================================================\n');

          app.log.info('Analyzing top 2 comments for a recipe...');
          const textRecipe = await textLlamaService.extractRecipeFromText(commentsText);
          
          if (textRecipe) {
            app.log.info('Successfully extracted recipe from comments.');
            return reply.code(200).send({ ...textRecipe, source: 'comments' });
          }
          app.log.info('No complete recipe found in comments. Falling back to video processing.');
        }

        // Download the video and extract sparse frames & audio
        const { tempDir, audioPath, framePaths } = await downloadService.downloadAndExtractFrames(url);
        tempDirectory = tempDir;
        app.log.info({ tempDir, frames: framePaths.length }, 'Video downloaded and frames extracted');

        // Have Gemini watch the frames + audio and output JSON
        const recipeData = await videoLlamaService.extractRecipe(audioPath, framePaths);
        
        return reply.code(200).send({ ...recipeData, source: 'video' });
      } catch (err) {
        app.log.error(err, 'Extraction failed');
        return reply.code(500).send({ error: 'Failed to process video in AI service', details: err instanceof Error ? err.message : String(err) });
      } finally {
        if (tempDirectory) {
          await fs.rm(tempDirectory, { recursive: true, force: true }).catch(() => {});
        }
      }
    }
  );
};
