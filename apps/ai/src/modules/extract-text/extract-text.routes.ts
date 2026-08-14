import fs from 'node:fs/promises';
import { z } from 'zod';
import type { FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  ExtractFromTextInputSchema,
  ExtractFromTextResultSchema,
  ExtractFromUrlInputSchema,
  ExtractFailureSchema,
  type ExtractFromUrlInput,
} from '@mixer/contracts';
import { extractRecipeFromText } from './extract-text.service.js';
import { downloadService, MAX_VIDEO_DURATION_SECONDS } from '../../download.service.js';
import { videoLlamaService } from '../../videoLlama.service.js';
import { retryWithBackoff } from '../../utils/retry.utils.js';
import { SourceUnreachableError } from './extract-failure.js';
import { stripMarkdownNoise } from '../../utils/markdown.utils.js';

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
        throw new SourceUnreachableError(
          `Failed to fetch webpage content from Jina Reader (${response.status} ${response.statusText})`,
        );
      }
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        throw new SourceUnreachableError('Jina Reader returned empty webpage content');
      }
      // Every caller feeds this straight to an LLM, so the noise is stripped
      // here rather than at each call site.
      const cleaned = stripMarkdownNoise(text);
      if (cleaned.length === 0) {
        throw new SourceUnreachableError('Jina Reader returned a page with no readable text');
      }
      return cleaned;
    },
    { retries: 3, initialDelayMs: 1000 },
  );
}

/**
 * Reads the page's Open Graph preview image (`og:image`).
 *
 * This is what TikTok/YouTube get from oEmbed, for everyone else: a picture the
 * page itself declares as representing its content — on a recipe site that's the
 * photo of the finished dish. Far better than anything we could search for, and
 * it costs one request.
 *
 * Not read from `fetchWebpageText`: that goes through Jina Reader, which returns
 * markdown with the `<head>` already stripped. So we fetch the raw HTML here.
 *
 * Best-effort by design — returns undefined on anything unexpected. A missing
 * cover is handled downstream; a thrown error would fail the whole import.
 */
async function fetchOpenGraphImage(url: string, log: (msg: string) => void): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return undefined;

    // Meta tags live in <head>, so the opening chunk is all we need — pages can
    // be megabytes and we are only after one attribute.
    const html = (await response.text()).slice(0, 200_000);

    // Attribute order varies between sites (`property` before or after
    // `content`), so try both arrangements before giving up.
    const patterns = [
      /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url|:url)?|twitter:image)["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image(?::secure_url|:url)?|twitter:image)["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      const raw = match?.[1]?.trim();
      if (!raw) continue;
      // Some sites declare a root-relative path; the recipe schema requires an
      // absolute URL, so resolve it against the page.
      const absolute = new URL(raw, url).toString();
      if (!/^https?:/i.test(absolute)) continue;
      log(`[extract/url] Captured og:image as recipe cover: ${absolute}`);
      return absolute;
    }
    return undefined;
  } catch (err) {
    log(`[extract/url] og:image lookup failed: ${err instanceof Error ? err.message : err}`);
    return undefined;
  }
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
 *
 * `ytDlpCaption` is whatever yt-dlp already read off the post. It costs nothing
 * here (the metadata call happened before the download) and covers the case
 * where Jina is rate-limited or served a login wall.
 */
async function fetchInstagramFallbackText(
  url: string,
  ytDlpCaption: string | undefined,
  log: (msg: string) => void,
): Promise<string> {
  const parts: string[] = [];

  if (ytDlpCaption?.trim()) {
    log(`[extract/url] Instagram — reusing caption from video metadata (${ytDlpCaption.length} chars)`);
    parts.push(ytDlpCaption.trim());
  }

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
  }

  if (parts.length === 0) {
    throw new SourceUnreachableError('All Instagram text extraction strategies failed');
  }

  return parts.join('\n');
}

/**
 * For YouTube URLs, use the public oEmbed API to retrieve the video caption/title
 * AND the thumbnail URL.
 */
async function fetchYouTubeOEmbed(url: string): Promise<{ caption: string; title?: string; author?: string; thumbnailUrl?: string }> {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const response = await fetch(oembedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!response.ok) {
    throw new Error(`YouTube oEmbed failed: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
  const caption = `YouTube video title by ${data.author_name ?? 'unknown'}:\n${data.title ?? ''}`;
  return { caption, title: data.title, author: data.author_name, thumbnailUrl: data.thumbnail_url };
}

/**
 * Combines YouTube oEmbed + yt-dlp metadata/description + any external recipe link content
 * to give as much context as possible when Gemini video analysis fails.
 */
async function fetchYouTubeFallbackText(
  url: string,
  log: (msg: string) => void,
): Promise<{ text: string; thumbnailUrl?: string }> {
  const parts: string[] = [];
  let thumbnailUrl: string | undefined;

  // 1. Try yt-dlp metadata (includes full description + title + thumbnail)
  try {
    const info = await downloadService.getVideoInfo(url);
    if (info.thumbnailUrl) thumbnailUrl = info.thumbnailUrl;
    if (info.title) parts.push(`Title: ${info.title}`);
    if (info.description) parts.push(`Description:\n${info.description}`);
  } catch (err) {
    log(`[extract/url] YouTube yt-dlp metadata failed: ${err instanceof Error ? err.message : err}`);
  }

  // 2. Try fetching top/pinned comments (often contains recipe when description is empty)
  try {
    const comments = await downloadService.getTopComments(url);
    if (comments && comments.trim().length > 0) {
      parts.push(`Top Comments:\n${comments}`);
    }
  } catch (err) {
    log(`[extract/url] YouTube top comments failed: ${err instanceof Error ? err.message : err}`);
  }

  // 3. Try oEmbed as secondary / backup metadata provider
  if (parts.length === 0) {
    try {
      const oembed = await fetchYouTubeOEmbed(url);
      if (oembed.caption) parts.push(oembed.caption);
      if (oembed.thumbnailUrl && !thumbnailUrl) thumbnailUrl = oembed.thumbnailUrl;
    } catch (err) {
      log(`[extract/url] YouTube oEmbed failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  // 3. Check if description contains an external recipe URL (e.g. blog link)
  const fullText = parts.join('\n\n');
  const urlMatches = fullText.match(/https?:\/\/[^\s"']+/g);
  if (urlMatches) {
    for (const link of urlMatches) {
      if (
        !link.includes('youtube.com') &&
        !link.includes('youtu.be') &&
        !link.includes('instagram.com') &&
        !link.includes('tiktok.com') &&
        !link.includes('facebook.com')
      ) {
        try {
          log(`[extract/url] Found external link in YouTube description: ${link}`);
          const externalPageText = await fetchWebpageText(link);
          if (externalPageText && externalPageText.trim().length > 100) {
            parts.push(`\n--- Recipe webpage content from link in description (${link}) ---\n${externalPageText.slice(0, 8000)}`);
            break;
          }
        } catch (err) {
          log(`[extract/url] Failed to fetch external link from YouTube description: ${err instanceof Error ? err.message : err}`);
        }
      }
    }
  }

  if (parts.length === 0) {
    throw new SourceUnreachableError('All YouTube text extraction strategies failed');
  }

  return { text: parts.join('\n\n'), thumbnailUrl };
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
    throw new SourceUnreachableError('All TikTok text extraction strategies failed');
  }

  return { text: parts.join('\n'), thumbnailUrl };
}


/**
 * Turns a thrown extraction error into the 422 the app can explain, or rethrows.
 *
 * Only two failures are worth a distinct message: the source was read but held
 * no recipe, and the source could not be read at all. Anything else is a bug on
 * our side and belongs in a 500 with a stack trace, not in a reassuring
 * sentence — so it goes back up untouched.
 */
function sendExtractFailure(
  reply: FastifyReply,
  error: unknown,
  subject: 'page' | 'video' | 'text',
): FastifyReply {
  if (error instanceof SourceUnreachableError) {
    return reply.code(422).send({
      error: `Could not read the ${subject}: ${error.message}`,
      code: 'source_unreachable',
    });
  }
  if (error instanceof Error && error.message === 'not_a_recipe') {
    return reply.code(422).send({
      error: `The ${subject} does not appear to contain a recipe.`,
      code: 'not_a_recipe',
    });
  }
  throw error;
}

export const extractTextRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/extract/text',
    {
      schema: {
        body: ExtractFromTextInputSchema,
        response: {
          200: ExtractFromTextResultSchema,
          422: ExtractFailureSchema,
        },
        tags: ['extract'],
      },
    },
    async (req, reply) => {
      try {
        return await extractRecipeFromText(req.body.text, req.body.locale);
      } catch (err) {
        if (err instanceof Error && err.message !== 'not_a_recipe') {
          console.error('[extract-text] unexpected error:', err.message);
        }
        return sendExtractFailure(reply, err, 'text');
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
                code: 'video_too_long',
                params: {
                  actualMinutes: Math.round(duration / 60),
                  maxMinutes: MAX_VIDEO_DURATION_SECONDS / 60,
                },
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
        // Same reasoning as `/extract/url`: a video model that saw no recipe in
        // the frames has not ruled out the caption, so this is not terminal.
        app.log.warn(`[extract/video] Video processing failed for ${url} — falling back to text scraping`);
        try {
          const text = await fetchWebpageText(url);
          const recipe = await extractRecipeFromText(text, locale);
          return reply.send(recipe);
        } catch (fallbackError) {
          if (!(fallbackError instanceof SourceUnreachableError)) {
            app.log.error(fallbackError);
          }
          return sendExtractFailure(reply, fallbackError, 'video');
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
          422: ExtractFailureSchema,
        },
        tags: ['extract'],
      },
    },
    async (req, reply) => {
      const { url, locale } = req.body as ExtractFromUrlInput;
      const isVideo = isVideoUrl(url);

      if (isVideo) {
        const isYouTube = /youtube\.com|youtu\.be/.test(url);
        let tempDirectory: string | undefined;
        let extractedThumbnailUrl: string | undefined;
        /** The post's own caption — often the only place the recipe is written out. */
        let videoCaption: string | undefined;

        try {
          app.log.info(`[extract/url] Fetching video info/duration for: ${url}`);
          try {
            const info = await downloadService.getVideoInfo(url);
            videoMetadataTitle = info.title;
            videoMetadataDescription = info.description;
            app.log.info(`[extract/url] Metadata title: "${info.title}", description length: ${info.description?.length ?? 0}`);

            if (info.thumbnailUrl) {
              extractedThumbnailUrl = info.thumbnailUrl;
              app.log.info(`[extract/url] Captured video thumbnail URL: ${extractedThumbnailUrl}`);
            }

            const caption = [info.title, info.description]
              .filter((part) => part && part.trim())
              .join('\n\n');
            if (caption) {
              videoCaption = caption;
              app.log.info(`[extract/url] Captured post caption (${caption.length} chars)`);
            }

            if (info.duration > MAX_VIDEO_DURATION_SECONDS) {
              return reply.code(422).send({
                error: `Video is too long (${Math.round(info.duration / 60)} min). Only short videos up to ${MAX_VIDEO_DURATION_SECONDS / 60} minutes are supported (Shorts, Reels, TikToks).`,
                code: 'video_too_long',
                params: {
                  actualMinutes: Math.round(info.duration / 60),
                  maxMinutes: MAX_VIDEO_DURATION_SECONDS / 60,
                },
              });
            }
          } catch {
            app.log.warn(`[extract/url] Could not fetch video metadata for ${url} — proceeding anyway`);
          }

          app.log.info(`[extract/url] Starting download and frame extraction for video URL: ${url}`);
          const { tempDir, audioPath, framePaths } = await downloadService.downloadAndExtractFrames(url);
          tempDirectory = tempDir;

          app.log.info(`[extract/url] Processing video frames and audio with Video AI`);
          const recipe = await videoLlamaService.extractRecipe(audioPath, framePaths, locale, videoCaption);

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
          } else if (isYouTube) {
            try {
              const { thumbnailUrl } = await fetchYouTubeOEmbed(url);
              if (thumbnailUrl) {
                videoThumbnailUrl = thumbnailUrl;
                app.log.info(`[extract/url] Captured YouTube oEmbed thumbnail URL`);
              }
            } catch {
              // Best-effort
            }
          }

          if (videoThumbnailUrl) {
            recipe.coverImageUrl = videoThumbnailUrl;
            app.log.info(`[extract/url] Applied video thumbnail as recipe cover image`);
          }

          return recipe;
        } catch (error) {
          // `not_a_recipe` is deliberately NOT terminal here. The video model
          // only ever sees frames and audio, so it answers "no recipe" for the
          // very common post that shows the finished dish and writes the recipe
          // out in the caption. That verdict is the reason to go read the text,
          // not a reason to stop — only the fallback below may return 422.
          app.log.warn(
            `[extract/url] Video processing failed or returned no recipe for ${url} (${error instanceof Error ? error.message : error}) — falling back to caption/text scraping`,
          );
          try {
            const isTikTok = url.includes('tiktok.com');
            const isInstagram = url.includes('instagram.com');
            const isYouTube = /youtube\.com|youtu\.be/.test(url);
            let text: string;
            let videoThumbnailUrlFallback: string | undefined = extractedThumbnailUrl;
            if (isTikTok) {
              app.log.info(`[extract/url] TikTok detected — fetching caption + page text via oEmbed + Jina: ${url}`);
              const result = await fetchTikTokFallbackText(url, (msg) => app.log.info(msg));
              text = result.text;
              if (result.thumbnailUrl) videoThumbnailUrlFallback = result.thumbnailUrl;
            } else if (isInstagram) {
              app.log.info(`[extract/url] Instagram detected — scraping page text via Jina: ${url}`);
              text = await fetchInstagramFallbackText(url, videoCaption, (msg) => app.log.info(msg));
            } else if (isYouTube) {
              app.log.info(`[extract/url] YouTube detected — fetching metadata/description via yt-dlp + oEmbed: ${url}`);
              const result = await fetchYouTubeFallbackText(url, (msg) => app.log.info(msg));
              text = result.text;
              if (result.thumbnailUrl) videoThumbnailUrlFallback = result.thumbnailUrl;
            } else {
              // Everything without a dedicated branch — Facebook, Pinterest, a
              // plain recipe site. No oEmbed to ask, so take the page's own
              // declared preview image.
              app.log.info(`[extract/url] Scraping text from webpage URL (fallback): ${url}`);
              const [pageText, ogImageUrl] = await Promise.all([
                fetchWebpageText(url),
                fetchOpenGraphImage(url, (msg) => app.log.info(msg)),
              ]);
              text = pageText;
              if (!videoThumbnailUrlFallback && ogImageUrl) {
                videoThumbnailUrlFallback = ogImageUrl;
              }
            }

            app.log.info(`[extract/url] Extracting recipe from caption/scraped text`);
            const recipe = await extractRecipeFromText(text, locale);
            if (videoThumbnailUrlFallback) {
              recipe.coverImageUrl = videoThumbnailUrlFallback;
            }
            return recipe;

          } catch (fallbackError) {
            if (!(fallbackError instanceof SourceUnreachableError)) {
              app.log.error(fallbackError);
            }
            return sendExtractFailure(reply, fallbackError, 'video');
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
          // In parallel with the text scrape — it's an independent request and
          // Jina is the slow half, so the cover costs no extra wall-clock time.
          const [text, ogImageUrl] = await Promise.all([
            fetchWebpageText(url),
            fetchOpenGraphImage(url, (msg) => app.log.info(msg)),
          ]);

          app.log.info(`[extract/url] Extracting recipe from scraped webpage text`);
          const recipe = await extractRecipeFromText(text, locale);
          if (!recipe.coverImageUrl && ogImageUrl) {
            recipe.coverImageUrl = ogImageUrl;
          }
          return recipe;
        } catch (error) {
          if (error instanceof Error && error.message === 'not_a_recipe') {
            return sendExtractFailure(reply, error, 'page');
          }
          if (error instanceof SourceUnreachableError) {
            return sendExtractFailure(reply, error, 'page');
          }
          app.log.error(error);
          throw new Error('Failed to extract recipe from webpage URL');
        }
      }
    }
  );
};
