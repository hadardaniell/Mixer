import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import ytDlp from 'yt-dlp-exec';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpeg from 'ffmpeg-static';

const execAsync = promisify(exec);

export const MAX_VIDEO_DURATION_SECONDS = 300; // 5 minutes — covers Reels (90s), Shorts (3min), TikToks

export const downloadService = {
  async getVideoInfo(url: string): Promise<{ duration: number; title: string }> {
    try {
      const info = await ytDlp(url, {
        dumpSingleJson: true,
        skipDownload: true,
        noWarnings: true,
        noCheckCertificate: true,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      } as any);

      const parsed = typeof info === 'string' ? JSON.parse(info) : (info as any);
      return {
        duration: parsed.duration ?? 0,
        title: parsed.title ?? '',
      };
    } catch {
      return { duration: 0, title: '' };
    }
  },

  async getTopComments(url: string): Promise<string> {
    try {
      console.log(`[download.service] Fetching metadata and comments for: ${url}`);
      
      const baseOptions: any = {
        dumpSingleJson: true,
        writeComments: true,
        skipDownload: true,
        noWarnings: true,
        noCheckCertificate: true,
        playlistEnd: 1,
        impersonate: 'chrome',
        extractorArgs: 'tiktok:api_hostname=api16-normal-c-useast1a.tiktokv.com',
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

    const strategies = [
      {
        output: outputPath,
        format: 'b[height<=480]/b/best[height<=480]/best/worst',
        noWarnings: true,
        noCheckCertificate: true,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      {
        output: outputPath,
        format: 'b/best',
        noWarnings: true,
        noCheckCertificate: true,
      },
      {
        output: outputPath,
        noWarnings: true,
        noCheckCertificate: true,
        extractorArgs: 'tiktok:api_hostname=api16-normal-c-useast1a.tiktokv.com',
      },
    ];

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
      }
    }

    if (!downloaded) {
      console.error(`[download.service] All download strategies failed for ${url}`);
      throw new Error(
        `Failed to download video. Platform might be blocking the request (403 Forbidden). URL: ${url}`,
      );
    }

    const audioPath = path.join(tempDir, 'audio.mp3');

    // 1. Extract lightweight mono audio track (16kHz, fast upload)
    await execAsync(`"${ffmpeg}" -i "${outputPath}" -vn -ar 16000 -ac 1 -ab 32k "${audioPath}" -y`).catch(() => {});
    
    // 2. Extract lightweight 480p frames every 4 seconds (fps=1/4, low quality q:v 5 for speed)
    await execAsync(`"${ffmpeg}" -i "${outputPath}" -vf "fps=1/4,scale=480:-1" -q:v 5 "${tempDir}/frame-%03d.jpg" -y`);

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