import fs from 'node:fs/promises';
import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ExtractFromTextInputSchema, ExtractFromTextResultSchema } from '@mixer/contracts';
import { extractRecipeFromText } from './extract-text.service.js';
import { downloadService, MAX_VIDEO_DURATION_SECONDS } from '../../download.service.js';
import { videoLlamaService } from '../../videoLlama.service.js';

export const extractTextRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/extract/text',
    {
      schema: {
        body: ExtractFromTextInputSchema,
        response: {
          200: ExtractFromTextResultSchema,
          422: z.object({ error: z.string() }),
        },
        tags: ['extract'],
      },
    },
    async (req, reply) => {
      try {
        return await extractRecipeFromText(req.body.text);
      } catch (err) {
        if (err instanceof Error && err.message === 'not_a_recipe') {
          return reply.code(422).send({ error: 'The provided text does not appear to contain a recipe.' });
        }
        throw err;
      }
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
      const isYouTube = /youtube\.com|youtu\.be/.test(url);
      let tempDirectory: string | undefined;

      try {
        if (isYouTube) {
          // YouTube: check duration first (no download), then send URL directly to Gemini
          app.log.info(`[extract/video] YouTube URL detected — checking duration for: ${url}`);
          try {
            const { duration } = await downloadService.getVideoInfo(url);
            if (duration > MAX_VIDEO_DURATION_SECONDS) {
              return reply.code(422).send({
                error: `Video is too long (${Math.round(duration / 60)} min). Only short videos up to ${MAX_VIDEO_DURATION_SECONDS / 60} minutes are supported (Shorts, Reels, TikToks).`,
              });
            }
          } catch {
            app.log.warn(`[extract/video] Could not fetch YouTube metadata for ${url} — proceeding anyway`);
          }

          app.log.info(`[extract/video] Sending YouTube URL directly to Gemini`);
          const recipe = await videoLlamaService.extractRecipeFromYouTube(url);
          return reply.send(recipe);
        } else {
          // TikTok / Instagram / other: download + extract frames, then send to Gemini
          app.log.info(`[extract/video] Downloading and extracting frames for: ${url}`);
          const { tempDir, audioPath, framePaths } = await downloadService.downloadAndExtractFrames(url);
          tempDirectory = tempDir;

          app.log.info(`[extract/video] Processing frames and audio with Video AI`);
          const recipe = await videoLlamaService.extractRecipe(audioPath, framePaths);
          return reply.send(recipe);
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'not_a_recipe') {
          return reply.code(422).send({ error: 'The video does not appear to contain a recipe.' });
        }
        app.log.error(error);
        return reply.code(500).send({ error: 'Failed to process video' });
      } finally {
        if (tempDirectory) {
          await fs.rm(tempDirectory, { recursive: true, force: true }).catch(err => {
            app.log.error(`[extract/video] Failed to cleanup temp directory ${tempDirectory}: ${err}`);
          });
        }
      }
    }
  );
};
