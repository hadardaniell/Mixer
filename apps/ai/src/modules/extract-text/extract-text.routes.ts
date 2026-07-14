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
import { downloadService } from '../../download.service.js';
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

  app.post(
    '/extract/url',
    {
      schema: {
        body: ExtractFromUrlInputSchema,
        response: { 200: ExtractFromTextResultSchema },
        tags: ['extract'],
      },
    },
    async (req) => {
      const { url } = req.body as ExtractFromUrlInput;
      const isVideo = isVideoUrl(url);

      if (isVideo) {
        let tempDirectory: string | undefined;
        try {
          app.log.info(`[extract/url] Starting download and frame extraction for video URL: ${url}`);
          const { tempDir, audioPath, framePaths } = await downloadService.downloadAndExtractFrames(url);
          tempDirectory = tempDir;

          app.log.info(`[extract/url] Processing video frames and audio with Video AI`);
          const recipe = await videoLlamaService.extractRecipe(audioPath, framePaths);
          return recipe;
        } catch (error) {
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
          const recipe = await extractRecipeFromText(text);
          return recipe;
        } catch (error) {
          app.log.error(error);
          throw new Error('Failed to extract recipe from webpage URL');
        }
      }
    }
  );
};
