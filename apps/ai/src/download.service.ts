import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import ytDlp from 'yt-dlp-exec';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpeg from 'ffmpeg-static';

const execAsync = promisify(exec);

export const downloadService = {
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

    const baseOptions: any = {
      output: outputPath,
      format: 'worstvideo[height>=360][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      noWarnings: true,
      noCheckCertificate: true,
      impersonate: 'chrome',
      extractorArgs: 'tiktok:api_hostname=api16-normal-c-useast1a.tiktokv.com',
    };

    try {
      await ytDlp(url, baseOptions);
    } catch (finalErr) {
      console.error(`[download.service] Final download attempt failed.`);
      throw new Error(`Failed to download video. Platform might be blocking the request (403 Forbidden). URL: ${url}`);
    }

    const audioPath = path.join(tempDir, 'audio.mp3');

    // 1. Extract audio track
    await execAsync(`"${ffmpeg}" -i "${outputPath}" -q:a 0 -map a "${audioPath}" -y`).catch(() => {});
    
    // 2. Extract 1 frame every 2 seconds (fps=1/2)
    await execAsync(`"${ffmpeg}" -i "${outputPath}" -vf fps=1/2 "${tempDir}/frame-%03d.jpg" -y`);

    const files = await fs.readdir(tempDir);
    const framePaths = files.filter(f => f.startsWith('frame-') && f.endsWith('.jpg')).map(f => path.join(tempDir, f));

    return { tempDir, audioPath, framePaths };
  },
};