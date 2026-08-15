import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { fileURLToPath } from 'node:url';
import ytDlp from 'yt-dlp-exec';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpeg from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

export const MAX_VIDEO_DURATION_SECONDS = 300; // 5 minutes — covers Reels (90s), Shorts (3min), TikToks

function findCookiePath(url: string): string | undefined {
  const lowercaseUrl = url.toLowerCase();
  const isYouTube = /youtube\.com|youtu\.be/.test(lowercaseUrl);
  const isInstagram = lowercaseUrl.includes('instagram.com');

  const candidates = isInstagram
    ? ['instagram-cookies.txt', 'cookies.txt']
    : isYouTube
    ? ['youtube-cookies.txt', 'cookies.txt']
    : ['cookies.txt', 'instagram-cookies.txt', 'youtube-cookies.txt'];

  const searchDirs = [
    process.cwd(),
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../..'),
  ];

  for (const dir of searchDirs) {
    const file = candidates.find((f) => {
      try {
        fsSync.accessSync(path.join(dir, f), fsSync.constants.R_OK);
        return true;
      } catch {
        return false;
      }
    });
    if (file) {
      return path.join(dir, file);
    }
  }
  return undefined;
}

export const downloadService = {
  async getVideoInfo(url: string): Promise<{ duration: number; title: string; description?: string; thumbnailUrl?: string }> {
    try {
      const cookiePath = findCookiePath(url);
      const isYouTube = /youtube\.com|youtu\.be/.test(url.toLowerCase());
      const proxy = process.env.PROXY_URL;

      const isInstagram = url.toLowerCase().includes('instagram.com');

      const optionsList: any[] = isYouTube
        ? [
            {
              dumpSingleJson: true,
              skipDownload: true,
              noWarnings: true,
              noCheckCertificate: true,
              extractorArgs: 'youtube:player_client=mweb,android,web',
              ...(proxy ? { proxy } : {}),
              ...(cookiePath ? { cookies: cookiePath } : {}),
            },
            {
              dumpSingleJson: true,
              skipDownload: true,
              noWarnings: true,
              noCheckCertificate: true,
              extractorArgs: 'youtube:player_client=mweb,android,web',
              ...(proxy ? { proxy } : {}),
            },
            {
              dumpSingleJson: true,
              skipDownload: true,
              noWarnings: true,
              noCheckCertificate: true,
              ...(proxy ? { proxy } : {}),
            },
          ]
        // 5 identical Instagram attempts — each one hits the rotating proxy and
        // gets a fresh residential IP, so failed attempts self-heal on retry.
        : isInstagram
        ? Array.from({ length: 5 }, () => ({
            dumpSingleJson: true,
            skipDownload: true,
            noWarnings: true,
            noCheckCertificate: true,
            impersonate: 'chrome',
            ...(proxy ? { proxy } : {}),
            ...(cookiePath ? { cookies: cookiePath } : {}),
          }))
        : [
            {
              dumpSingleJson: true,
              skipDownload: true,
              noWarnings: true,
              noCheckCertificate: true,
              impersonate: 'chrome',
              ...(proxy ? { proxy } : {}),
              ...(cookiePath ? { cookies: cookiePath } : {}),
            },
            {
              dumpSingleJson: true,
              skipDownload: true,
              noWarnings: true,
              noCheckCertificate: true,
              impersonate: 'chrome',
              ...(proxy ? { proxy } : {}),
            },
            {
              dumpSingleJson: true,
              skipDownload: true,
              noWarnings: true,
              noCheckCertificate: true,
              ...(proxy ? { proxy } : {}),
            },
          ];

      let info: any;
      if (proxy) { optionsList.forEach(opts => opts.proxy = proxy); }
      for (const opts of optionsList) {
        try {
          info = await ytDlp(url, opts);
          if (info) break;
        } catch {
          if (isInstagram) {
            console.log('[download.service] Instagram info fetch failed — waiting 2s for a fresh proxy IP before retry…');
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      if (!info) {
        throw new Error('Could not fetch video info');
      }

      const parsed = typeof info === 'string' ? JSON.parse(info) : (info as any);
      return {
        duration: parsed.duration ?? 0,
        title: parsed.title ?? '',
        description: parsed.description,
        thumbnailUrl: parsed.thumbnail,
      };
    } catch (err) {
      console.warn(`[download.service] getVideoInfo failed for ${url}:`, err instanceof Error ? err.message : err);
      return { duration: 0, title: '' };
    }
  },

  async getTopComments(url: string): Promise<string> {
    try {
      console.log(`[download.service] Fetching metadata and comments for: ${url}`);
      
      const isYouTube = /youtube\.com|youtu\.be/.test(url.toLowerCase());
      const proxy = process.env.PROXY_URL;
      
      const baseOptions: any = {
        dumpSingleJson: true,
        writeComments: true,
        skipDownload: true,
        noWarnings: true,
        noCheckCertificate: true,
        playlistEnd: 1,
        impersonate: 'chrome',
        extractorArgs: 'tiktok:api_hostname=api16-normal-c-useast1a.tiktokv.com',
        ...(proxy ? { proxy } : {}),
      };

      const info = await ytDlp(url, baseOptions);

      // yt-dlp sometimes returns a stringified JSON. Let's make sure it's an object!
      const parsedInfo = typeof info === 'string' ? JSON.parse(info) : info;

      // Check if comments exist and return the first 2
      if (parsedInfo && parsedInfo.comments && Array.isArray(parsedInfo.comments)) {
        console.log(`[download.service] Successfully found ${parsedInfo.comments.length} comments!`);
        const topComments = parsedInfo.comments.slice(0, 2).map((c: any) => c.text);
        return topComments.join('\n\n');
      }
      
      console.log(`[download.service] No 'comments' array found in yt-dlp output.`);
      console.log(`[download.service] (This usually means the platform blocks comment scraping without cookies)`);
      
    } catch (error) {
      console.error('❌ [download.service] Failed to extract comments:', error instanceof Error ? error.message : String(error));
    }
    return '';
  },

  async downloadAndExtractFrames(url: string): Promise<{ tempDir: string, audioPath: string, framePaths: string[] }> {
    // Create a unique temporary directory for this import task
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mixer-import-'));
    const outputPath = path.join(tempDir, 'video.mp4');

    const isTikTok = url.toLowerCase().includes('tiktok.com');
    const isInstagram = url.toLowerCase().includes('instagram.com');
    const isYouTube = /youtube\.com|youtu\.be/.test(url.toLowerCase());

    const cookiePath = findCookiePath(url);
    if (cookiePath) {
      console.log(`[download.service] Found cookie file at ${cookiePath} — passing to yt-dlp`);
    }

    const proxy = process.env.PROXY_URL;

    const strategies = isTikTok
      ? [
          {
            output: outputPath,
            format: 'b[height<=480]/b/best[height<=480]/best/worst',
            noWarnings: true,
            noCheckCertificate: true,
            extractorArgs: 'tiktok:api_hostname=api16-normal-c-useast1a.tiktokv.com',
            ...(cookiePath ? { cookies: cookiePath } : {}),
          },
          {
            output: outputPath,
            format: 'b/best',
            noWarnings: true,
            noCheckCertificate: true,
            extractorArgs: 'tiktok:api_hostname=api16-normal-c-useast1a.tiktokv.com',
            ...(cookiePath ? { cookies: cookiePath } : {}),
          },
        ]
      : isInstagram
      ? [
          {
            output: outputPath,
            format: 'b[height<=480]/b/best[height<=480]/best/worst',
            noWarnings: true,
            noCheckCertificate: true,
            impersonate: 'chrome',
            ...(cookiePath ? { cookies: cookiePath } : {}),
          },
          {
            output: outputPath,
            format: 'b[height<=480]/b/best[height<=480]/best/worst',
            noWarnings: true,
            noCheckCertificate: true,
            impersonate: 'chrome',
            ...(cookiePath ? { cookies: cookiePath } : {}),
          },
          {
            output: outputPath,
            format: 'b[height<=480]/b/best[height<=480]/best/worst',
            noWarnings: true,
            noCheckCertificate: true,
            impersonate: 'chrome',
            ...(cookiePath ? { cookies: cookiePath } : {}),
          },
          {
            output: outputPath,
            format: 'b/best',
            noWarnings: true,
            noCheckCertificate: true,
            impersonate: 'chrome',
            ...(cookiePath ? { cookies: cookiePath } : {}),
          },
          {
            output: outputPath,
            format: 'b/best',
            noWarnings: true,
            noCheckCertificate: true,
            impersonate: 'chrome',
            ...(cookiePath ? { cookies: cookiePath } : {}),
          },
        ]
      : isYouTube
      ? [
          {
            output: outputPath,
            format: 'b[height<=480]/b/best[height<=480]/best/worst',
            noWarnings: true,
            noCheckCertificate: true,
            extractorArgs: 'youtube:player_client=mweb,android,web',
            ...(proxy ? { proxy } : {}),
            ...(cookiePath ? { cookies: cookiePath } : {}),
          },
          {
            output: outputPath,
            format: 'b[height<=480]/b/best[height<=480]/best/worst',
            noWarnings: true,
            noCheckCertificate: true,
            extractorArgs: 'youtube:player_client=mweb,android,web',
            ...(proxy ? { proxy } : {}),
          },
          {
            output: outputPath,
            format: 'b[height<=480]/b/best[height<=480]/best/worst',
            noWarnings: true,
            noCheckCertificate: true,
            impersonate: 'chrome',
            ...(proxy ? { proxy } : {}),
          },
          {
            output: outputPath,
            format: 'b/best',
            noWarnings: true,
            noCheckCertificate: true,
            ...(proxy ? { proxy } : {}),
          },
        ]
      : [
          {
            output: outputPath,
            format: 'b[height<=480]/b/best[height<=480]/best/worst',
            noWarnings: true,
            noCheckCertificate: true,
            userAgent:
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ...(cookiePath ? { cookies: cookiePath } : {}),
          },
          {
            output: outputPath,
            format: 'b/best',
            noWarnings: true,
            noCheckCertificate: true,
            ...(cookiePath ? { cookies: cookiePath } : {}),
          },
        ];

    if (proxy) {
      strategies.forEach(strategy => {
        (strategy as any).proxy = proxy;
      });
    }

    // Inject cookies into all strategies if a cookie file was found
    if (cookiePath) {
      strategies.forEach(strategy => {
        (strategy as any).cookies = cookiePath;
      });
    }

    let downloaded = false;
    let lastError: unknown;

    for (const options of strategies) {
      try {
        await ytDlp(url, options as any);
        downloaded = true;
        break;
      } catch (err) {
        lastError = err;
        console.warn(
          `[download.service] ytDlp strategy failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
        );
        // For Instagram, wait 2 seconds before the next attempt so the rotating
        // proxy assigns a fresh residential IP, dramatically improving success rate.
        if (isInstagram) {
          console.log('[download.service] Instagram failed — waiting 2s for a fresh proxy IP before retry…');
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (!downloaded) {
      console.error(`[download.service] All download strategies failed for ${url}`);
      throw new Error(
        `Failed to download video. Platform might be blocking the request (403 Forbidden). URL: ${url}`,
      );
    }

    const audioPath = path.join(tempDir, 'audio.mp3');

    // 1 & 2. Extract lightweight audio + 480p frames concurrently in parallel for max CPU speed
    await Promise.all([
      execAsync(`"${ffmpeg}" -i "${outputPath}" -vn -ar 16000 -ac 1 -ab 32k "${audioPath}" -y`).catch(() => {}),
      execAsync(`"${ffmpeg}" -i "${outputPath}" -vf "fps=1/4,scale=480:-1" -q:v 5 "${tempDir}/frame-%03d.jpg" -y`),
    ]);

    const files = await fs.readdir(tempDir);
    let framePaths = files
      .filter((f) => f.startsWith('frame-') && f.endsWith('.jpg'))
      .map((f) => path.join(tempDir, f))
      .sort();

    // 3. Cap at max 12 evenly-spaced frames to keep Gemini upload & processing fast
    const MAX_FRAMES = 12;
    if (framePaths.length > MAX_FRAMES) {
      const step = framePaths.length / MAX_FRAMES;
      const sampled: string[] = [];
      for (let i = 0; i < MAX_FRAMES; i++) {
        const frame = framePaths[Math.floor(i * step)];
        if (frame) sampled.push(frame);
      }
      framePaths = sampled;
    }

    return { tempDir, audioPath, framePaths };
  },
};