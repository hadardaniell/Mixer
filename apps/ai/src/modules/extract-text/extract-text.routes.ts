import fs from 'node:fs/promises';
import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  ExtractFromTextInputSchema,
  ExtractFromTextResultSchema,
  ExtractFromUrlInputSchema,
  type ExtractFromUrlInput,
} from '@mixer/contracts';
import { extractRecipeFromText } from './extract-text.service.js';
import { downloadService, MAX_VIDEO_DURATION_SECONDS } from '../../download.service.js';
import { videoLlamaService } from '../../videoLlama.service.js';

function isVideoUrl(url: string): boolean {
  const lowercaseUrl = url.toLowerCase();
  return (
    lowercaseUrl.includes('youtube.com') ||
    lowercaseUrl.includes('youtu.be') ||
    lowercaseUrl.includes('tiktok.com') ||
    lowercaseUrl.includes('instagram.com') ||
    lowercaseUrl.includes('facebook.com') ||
    lowercaseUrl.includes('fb.watch')
  );
}

async function fetchWebpageText(url: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (process.env.JINA_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
  }
  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch webpage content from Jina Reader: ${response.statusText}`);
  }
  return response.text();
}

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

  app.post(
    '/extract/url',
    {
      schema: {
        body: ExtractFromUrlInputSchema,
        response: {
          200: ExtractFromTextResultSchema,
          422: z.object({ error: z.string() }),
        },
        tags: ['extract'],
      },
    },
    async (req, reply) => {
      const { url } = req.body as ExtractFromUrlInput;
      const isVideo = isVideoUrl(url);

      if (isVideo) {
        const isYouTube = /youtube\.com|youtu\.be/.test(url);
        let tempDirectory: string | undefined;
        try {
          if (isYouTube) {
            // YouTube: check duration first (no download), then send the URL
            // straight to Gemini — cheaper and faster than downloading frames.
            app.log.info(`[extract/url] YouTube URL detected — checking duration for: ${url}`);
            try {
              const { duration } = await downloadService.getVideoInfo(url);
              if (duration > MAX_VIDEO_DURATION_SECONDS) {
                return reply.code(422).send({
                  error: `Video is too long (${Math.round(duration / 60)} min). Only short videos up to ${MAX_VIDEO_DURATION_SECONDS / 60} minutes are supported (Shorts, Reels, TikToks).`,
                });
              }
            } catch {
              app.log.warn(`[extract/url] Could not fetch YouTube metadata for ${url} — proceeding anyway`);
            }

            app.log.info(`[extract/url] Sending YouTube URL directly to Gemini`);
            return await videoLlamaService.extractRecipeFromYouTube(url);
          }

          app.log.info(`[extract/url] Starting download and frame extraction for video URL: ${url}`);
          const { tempDir, audioPath, framePaths } = await downloadService.downloadAndExtractFrames(url);
          tempDirectory = tempDir;

          app.log.info(`[extract/url] Processing video frames and audio with Video AI`);
          return await videoLlamaService.extractRecipe(audioPath, framePaths);
        } catch (error) {
          if (error instanceof Error && error.message === 'not_a_recipe') {
            return reply.code(422).send({ error: 'The video does not appear to contain a recipe.' });
          }
          app.log.error(error);
          throw new Error('Failed to process video URL');
        } finally {
          if (tempDirectory) {
            await fs.rm(tempDirectory, { recursive: true, force: true }).catch(err => {
              app.log.error(`[extract/url] Failed to cleanup temp directory ${tempDirectory}: ${err}`);
            });
          }
        }
      } else {
        try {
          app.log.info(`[extract/url] Scraping text from webpage URL: ${url}`);
          const text = await fetchWebpageText(url);

          app.log.info(`[extract/url] Extracting recipe from scraped webpage text`);
          return await extractRecipeFromText(text);
        } catch (error) {
          if (error instanceof Error && error.message === 'not_a_recipe') {
            return reply.code(422).send({ error: 'The page does not appear to contain a recipe.' });
          }
          app.log.error(error);
          throw new Error('Failed to extract recipe from webpage URL');
        }
      }
    }
  );
};
