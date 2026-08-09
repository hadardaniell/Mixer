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
import { retryWithBackoff } from '../../utils/retry.utils.js';

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
  return retryWithBackoff(
    async () => {
      const headers: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };
      if (process.env.JINA_API_KEY) {
        headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
      }
      const response = await fetch(`https://r.jina.ai/${url}`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch webpage content from Jina Reader (${response.status} ${response.statusText})`);
      }
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        throw new Error('Jina Reader returned empty webpage content');
      }
      return text;
    },
    { retries: 3, initialDelayMs: 1000 },
  );
}

/**
 * For TikTok URLs, use the public oEmbed API to retrieve the video caption/title.
 * This avoids scraping the TikTok HTML page which contains no useful recipe text.
 */
async function fetchTikTokCaption(url: string): Promise<string> {
  const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const response = await fetch(oembedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!response.ok) {
    throw new Error(`TikTok oEmbed failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json() as { title?: string; author_name?: string };
  const caption = data.title ?? '';
  return `TikTok video caption by ${data.author_name ?? 'unknown'}:\n${caption}`;
}

/**
 * For Instagram Reels, try to scrape the page text via Jina with special headers.
 * Instagram doesn't have a useful oEmbed API for captions, so Jina is our best bet.
 * The description field in Open Graph meta tags often contains the reel caption.
 */
async function fetchInstagramFallbackText(url: string, log: (msg: string) => void): Promise<string> {
  const parts: string[] = [];

  // 1. Jina page scrape with Accept-Language header to get English content
  try {
    log(`[extract/url] Instagram — scraping page text via Jina: ${url}`);
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    };
    if (process.env.JINA_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
    }
    const response = await fetch(`https://r.jina.ai/${url}`, { headers });
    if (response.ok) {
      const text = await response.text();
      if (text && text.trim().length > 50) {
        log(`[extract/url] Instagram Jina scrape succeeded (${text.length} chars)`);
        parts.push(text.slice(0, 8000));
      }
    }
  } catch (err) {
    log(`[extract/url] Instagram Jina scrape failed: ${err instanceof Error ? err.message : err}`);
  }

  if (parts.length === 0) {
    throw new Error('All Instagram text extraction strategies failed');
  }

  return parts.join('\n');
}

/**
 * For TikTok URLs, use the public oEmbed API to retrieve the video caption/title
 * AND the thumbnail URL (an actual frame from the video, highly relevant).
 */
async function fetchTikTokOEmbed(url: string): Promise<{ caption: string; thumbnailUrl?: string }> {
  const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const response = await fetch(oembedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!response.ok) {
    throw new Error(`TikTok oEmbed failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json() as { title?: string; author_name?: string; thumbnail_url?: string };
  const caption = `TikTok video caption by ${data.author_name ?? 'unknown'}:\n${data.title ?? ''}`;
  return { caption, thumbnailUrl: data.thumbnail_url };
}

/**
 * Combines TikTok oEmbed caption + Jina page text to give as much context as possible
 * to Groq when Gemini video analysis is unavailable (quota exceeded).
 * Also returns the thumbnail URL from oEmbed for use as the recipe cover image.
 */
async function fetchTikTokFallbackText(url: string, log: (msg: string) => void): Promise<{ text: string; thumbnailUrl?: string }> {
  const parts: string[] = [];
  let thumbnailUrl: string | undefined;

  // 1. oEmbed caption (fast, usually works) — also grabs the video thumbnail
  try {
    const oembed = await fetchTikTokOEmbed(url);
    if (oembed.caption.trim()) {
      log(`[extract/url] oEmbed caption fetched: ${oembed.caption.slice(0, 120)}...`);
      parts.push(oembed.caption);
    }
    if (oembed.thumbnailUrl) {
      thumbnailUrl = oembed.thumbnailUrl;
      log(`[extract/url] oEmbed thumbnail URL captured: ${thumbnailUrl}`);
    }
  } catch (err) {
    log(`[extract/url] oEmbed failed: ${err instanceof Error ? err.message : err}`);
  }

  // 2. Jina page scrape (slower, but may contain pinned comments with full recipe)
  try {
    const pageText = await fetchWebpageText(url);
    if (pageText.trim()) {
      parts.push(`\n--- Page text ---\n${pageText.slice(0, 6000)}`);
    }
  } catch (err) {
    log(`[extract/url] Jina page scrape failed: ${err instanceof Error ? err.message : err}`);
  }

  if (parts.length === 0) {
    throw new Error('All TikTok text extraction strategies failed');
  }

  return { text: parts.join('\n'), thumbnailUrl };
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
        return await extractRecipeFromText(req.body.text, req.body.locale);
      } catch (err) {
        if (err instanceof Error && err.message === 'not_a_recipe') {
          return reply.code(422).send({ error: 'The provided text does not appear to contain a recipe.' });
        }
        console.error('[extract-text] unexpected error:', err instanceof Error ? err.message : err);
        throw err;
      }
    },
  );

  app.post(
    '/extract/video',
    {
      schema: {
        body: z.object({ url: z.string().url(), locale: z.string().optional() }),
      },
    },
    async (req, reply) => {
      const { url, locale } = req.body;
      const isYouTube = /youtube\.com|youtu\.be/.test(url);
      let tempDirectory: string | undefined;

      try {
        if (isYouTube) {
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
        }

        app.log.info(`[extract/video] Downloading and extracting frames for: ${url}`);
        const { tempDir, audioPath, framePaths } = await downloadService.downloadAndExtractFrames(url);
        tempDirectory = tempDir;

        app.log.info(`[extract/video] Processing frames and audio with Video AI`);
        const recipe = await videoLlamaService.extractRecipe(audioPath, framePaths, locale);
        return reply.send(recipe);
      } catch (error) {
        if (error instanceof Error && error.message === 'not_a_recipe') {
          return reply.code(422).send({ error: 'The video does not appear to contain a recipe.' });
        }
        app.log.warn(`[extract/video] Video processing failed for ${url} — falling back to text scraping`);
        try {
          const text = await fetchWebpageText(url);
          const recipe = await extractRecipeFromText(text, locale);
          return reply.send(recipe);
        } catch (fallbackError) {
          if (fallbackError instanceof Error && fallbackError.message === 'not_a_recipe') {
            return reply.code(422).send({ error: 'The video does not appear to contain a recipe.' });
          }
          app.log.error(fallbackError);
          return reply.code(500).send({ error: 'Failed to process video' });
        }
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
      const { url, locale } = req.body as ExtractFromUrlInput;
      const isVideo = isVideoUrl(url);

      if (isVideo) {
        const isYouTube = /youtube\.com|youtu\.be/.test(url);
        const isInstagram = url.includes('instagram.com');
        let tempDirectory: string | undefined;
        let extractedThumbnailUrl: string | undefined;

        try {
          app.log.info(`[extract/url] Fetching video info/duration for: ${url}`);
          try {
            const info = await downloadService.getVideoInfo(url);
            
            if (info.thumbnailUrl) {
              extractedThumbnailUrl = info.thumbnailUrl;
              app.log.info(`[extract/url] Captured video thumbnail URL: ${extractedThumbnailUrl}`);
            }

            if (info.duration > MAX_VIDEO_DURATION_SECONDS) {
              return reply.code(422).send({
                error: `Video is too long (${Math.round(info.duration / 60)} min). Only short videos up to ${MAX_VIDEO_DURATION_SECONDS / 60} minutes are supported (Shorts, Reels, TikToks).`,
              });
            }
          } catch {
            app.log.warn(`[extract/url] Could not fetch video metadata for ${url} — proceeding anyway`);
          }

          app.log.info(`[extract/url] Starting download and frame extraction for video URL: ${url}`);
          const { tempDir, audioPath, framePaths } = await downloadService.downloadAndExtractFrames(url);
          tempDirectory = tempDir;

          app.log.info(`[extract/url] Processing video frames and audio with Video AI`);
          const recipe = await videoLlamaService.extractRecipe(audioPath, framePaths, locale);

          // For all video platforms (TikTok, Instagram, YouTube, Facebook, Pinterest, etc), 
          // override the Unsplash cover image with the actual video thumbnail
          // because it's directly relevant to the dish being cooked.
          let videoThumbnailUrl: string | undefined = extractedThumbnailUrl;
          
          if (url.includes('tiktok.com')) {
            try {
              const { thumbnailUrl } = await fetchTikTokOEmbed(url);
              if (thumbnailUrl) {
                videoThumbnailUrl = thumbnailUrl;
                app.log.info(`[extract/url] Captured TikTok oEmbed thumbnail URL`);
              }
            } catch {
              // Best-effort; fallback to whatever we have
            }
          }

          if (videoThumbnailUrl) {
            recipe.coverImageUrl = videoThumbnailUrl;
            app.log.info(`[extract/url] Applied video thumbnail as recipe cover image`);
          }

          return recipe;
        } catch (error) {
          if (error instanceof Error && error.message === 'not_a_recipe') {
            return reply.code(422).send({ error: 'The video does not appear to contain a recipe.' });
          }
          app.log.warn(
            `[extract/url] Video processing failed for ${url} (${error instanceof Error ? error.message : error}) — falling back to caption/text scraping`,
          );
          try {
            const isTikTok = url.includes('tiktok.com');
            const isInstagram = url.includes('instagram.com');
            let text: string;
            let tiktokThumbnailUrl: string | undefined;
            if (isTikTok) {
              app.log.info(`[extract/url] TikTok detected — fetching caption + page text via oEmbed + Jina: ${url}`);
              const result = await fetchTikTokFallbackText(url, (msg) => app.log.info(msg));
              text = result.text;
              tiktokThumbnailUrl = result.thumbnailUrl;
            } else if (isInstagram) {
              app.log.info(`[extract/url] Instagram detected — scraping page text via Jina: ${url}`);
              text = await fetchInstagramFallbackText(url, (msg) => app.log.info(msg));
            } else {
              app.log.info(`[extract/url] Scraping text from webpage URL (fallback): ${url}`);
              text = await fetchWebpageText(url);
            }

            app.log.info(`[extract/url] Extracting recipe from caption/scraped text`);
            const recipe = await extractRecipeFromText(text, locale);
            // Use the actual TikTok video thumbnail as the cover image — it's
            // always relevant to the dish being cooked in that specific video.
            if (tiktokThumbnailUrl && !recipe.coverImageUrl) {
              return { ...recipe, coverImageUrl: tiktokThumbnailUrl };
            }
            if (tiktokThumbnailUrl) {
              recipe.coverImageUrl = tiktokThumbnailUrl;
            }
            return recipe;

          } catch (fallbackError) {
            if (fallbackError instanceof Error && fallbackError.message === 'not_a_recipe') {
              return reply.code(422).send({ error: 'The page does not appear to contain a recipe.' });
            }
            app.log.error(fallbackError);
            throw new Error('Failed to process video URL');
          }
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
