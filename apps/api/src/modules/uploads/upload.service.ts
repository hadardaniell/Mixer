// apps/api/src/modules/uploads/upload.service.ts

import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

export async function saveRecipeImage(
  file: any,
  recipeId: string,
): Promise<string> {

  const uploadsDir = path.join(
    process.cwd(),
    'uploads',
    'recipes',
  );

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const extension =
    path.extname(file.filename) || '.jpg';

  const filename =
    `${recipeId}-${Date.now()}${extension}`;

  const uploadPath = path.join(
    uploadsDir,
    filename,
  );

  await pipeline(
    file.file,
    fs.createWriteStream(uploadPath),
  );

  return `/uploads/recipes/${filename}`;
}