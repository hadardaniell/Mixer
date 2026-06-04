// apps/api/src/plugins/upload.ts

import fs from 'node:fs';
import path from 'node:path';

export const uploadsDir = path.join(
  process.cwd(),
  'uploads',
  'recipes',
);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}