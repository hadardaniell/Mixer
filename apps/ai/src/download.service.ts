import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import ytDlp from 'yt-dlp-exec';

export const downloadService = {
  async download(url: string): Promise<string> {
    // Create a unique temporary directory for this import task
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mixer-import-'));
    const outputPath = path.join(tempDir, 'video.mp4');

    // Download the video using yt-dlp-exec
    await ytDlp(url, {
      output: outputPath,
      format: 'best',
      noWarnings: true,
      noCheckCertificate: true,
    });

    return outputPath;
  },
};