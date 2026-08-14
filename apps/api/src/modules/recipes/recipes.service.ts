import { Collection, ObjectId } from 'mongodb';
import type { Bucket } from '@google-cloud/storage';
import { config } from '../../config.js';
import type { CoverImageDoc, RecipeDoc } from '../../db/types.js';
import { fetchPexelsImage } from '../../services/pexels.service.js';
import { findLibraryImage, saveLibraryImage } from './cover-library.service.js';

/** What the cover pipeline needs off a recipe. A RecipeDoc satisfies it. */
export type CoverImageRecipe = {
  title: string;
  description?: string;
  cuisine?: string;
  ingredients?: Array<{ name: string }>;
  steps?: Array<{ text: string }>;
  tags?: string[];
};

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/**
 * Hosts whose images are placeholders, not the user's own picture.
 *
 * The import preview routes fill `coverImageUrl` with a stock photo so the
 * review screen is not blank, and that value then arrives on the create
 * request. Treating it as a real cover would permanently deny imported recipes
 * a generated one — so a stock URL is replaced, a user-supplied URL is kept.
 */
const PLACEHOLDER_IMAGE_HOSTS = ['pexels.com', 'unsplash.com'];

export function needsGeneratedCover(coverImageUrl?: string): boolean {
  if (!coverImageUrl) return true;
  return PLACEHOLDER_IMAGE_HOSTS.some((host) => coverImageUrl.includes(host));
}

/** Images already served from our own bucket — nothing to mirror. */
export function isSelfHostedImage(url: string): boolean {
  return url.includes('storage.googleapis.com');
}

async function uploadBufferToBucket(
  bucket: Bucket,
  buffer: Buffer,
  destinationPath: string,
  contentType = 'image/jpeg'
): Promise<string> {
  const file = bucket.file(destinationPath);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000',
    },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
}

/**
 * Generates a cover with the AI service's image model.
 * Returns null (rather than throwing) so callers can fall through to stock search.
 */
async function generateCoverImageBuffer(
  recipe: CoverImageRecipe
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const res = await fetch(`${config.aiBaseUrl}/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: recipe.title,
        description: recipe.description,
        cuisine: recipe.cuisine,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        tags: recipe.tags,
      }),
    });

    if (!res.ok) {
      // Include the body: the useful part is always Gemini's message (bad model
      // name, billing not enabled, unsupported field), not the status code.
      console.warn(
        `[RecipeService] AI image generation returned ${res.status}: ${await res.text()}`
      );
      return null;
    }

    const { data, mimeType } = (await res.json()) as { data?: string; mimeType?: string };
    if (!data) return null;

    return { buffer: Buffer.from(data, 'base64'), mimeType: mimeType ?? 'image/png' };
  } catch (err) {
    console.warn('[RecipeService] AI image generation failed:', (err as Error).message);
    return null;
  }
}

/**
 * Copies a cover we don't host onto our own bucket, byte for byte.
 *
 * Import covers are thumbnails hotlinked from TikTok / YouTube / Facebook, and
 * those URLs carry expiry tokens — a recipe saved today can show a broken image
 * months later, silently. This is a copy, not a conversion: the same bytes, the
 * same content type, the same resolution.
 *
 * Returns null when there is nothing to do or the copy fails; the caller keeps
 * the original URL, which is still better than no image.
 */
export async function mirrorExternalCoverImage(
  recipesCollection: Collection<RecipeDoc>,
  firebaseBucket: Bucket | null | undefined,
  recipeId: ObjectId,
  coverImageUrl: string
): Promise<string | null> {
  if (!firebaseBucket || isSelfHostedImage(coverImageUrl)) return null;

  try {
    const res = await fetch(coverImageUrl);
    if (!res.ok) {
      console.warn(`[RecipeService] Could not mirror cover (${res.status}): ${coverImageUrl}`);
      return null;
    }

    const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
    const ext = EXTENSION_BY_MIME[contentType] ?? 'jpg';
    const buffer = Buffer.from(await res.arrayBuffer());

    const hostedUrl = await uploadBufferToBucket(
      firebaseBucket,
      buffer,
      `recipes/${recipeId.toString()}/cover-${Date.now()}.${ext}`,
      contentType
    );

    await recipesCollection.updateOne(
      { _id: recipeId },
      { $set: { coverImageUrl: hostedUrl, updatedAt: new Date() } }
    );
    return hostedUrl;
  } catch (err) {
    console.warn('[RecipeService] Failed to mirror external cover:', (err as Error).message);
    return null;
  }
}

/**
 * Stock-photo fallback: asks the AI service for an English search keyword, then
 * picks the best-matching Pexels photo. Only used when generation is unavailable.
 */
export async function getSuggestedCoverImageUrl(recipe: CoverImageRecipe): Promise<string | null> {
  if (!recipe.title) return null;
  try {
    const aiResponse = await fetch(`${config.aiBaseUrl}/suggest-keyword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: recipe.title,
        description: recipe.description,
        cuisine: recipe.cuisine,
        ingredients: recipe.ingredients,
      }),
    });

    if (!aiResponse.ok) return null;
    const { keyword } = (await aiResponse.json()) as { keyword: string };
    if (!keyword) return null;

    return await fetchPexelsImage(keyword);
  } catch (err) {
    console.error('[RecipeService] Failed to suggest keyword or fetch Pexels image:', err);
    return null;
  }
}

/**
 * Produces a cover image for a recipe and stores it on the recipe document.
 *
 * Order: an image already generated for this dish, then a fresh generation,
 * then stock search. Awaited by the create route, so the recipe reaches the
 * client complete.
 */
export async function generateAndStoreCoverImage(
  recipesCollection: Collection<RecipeDoc>,
  coverImages: Collection<CoverImageDoc>,
  firebaseBucket: Bucket | null | undefined,
  recipeId: ObjectId,
  recipe: CoverImageRecipe
): Promise<string | null> {
  try {
    let finalImageUrl: string | null = null;

    // 1. An image we already made for this dish. Free, instant, and the whole
    //    reason a popular dish is only ever generated once.
    const lookup = await findLibraryImage(coverImages, recipe).catch((err) => {
      console.warn('[RecipeService] Cover library lookup failed:', (err as Error).message);
      return null;
    });

    if (lookup?.imageUrl) {
      console.log(`[RecipeService] Cover library hit for "${lookup.label}"`);
      finalImageUrl = lookup.imageUrl;
    }

    if (!finalImageUrl && !firebaseBucket) {
      console.warn('[RecipeService] No storage bucket — skipping generation, falling back to stock');
    }

    // 2. Generate, upload to the shared library path, and file it under its dish.
    if (!finalImageUrl && firebaseBucket) {
      const generated = await generateCoverImageBuffer(recipe);
      if (generated) {
        try {
          const ext = EXTENSION_BY_MIME[generated.mimeType] ?? 'png';
          // A library image is shared by every recipe of the same dish, so it
          // cannot live under one recipe's folder. Only an image we can't file
          // under a dish (the AI service failed to name it) stays recipe-local.
          // Timestamped either way: `cache-control` is a year, so reusing a path
          // would serve the old bytes from the CDN.
          const destination = lookup?.dishKey
            ? `cover-library/${lookup.dishKey}-${Date.now()}.${ext}`
            : `recipes/${recipeId.toString()}/cover-${Date.now()}.${ext}`;

          finalImageUrl = await uploadBufferToBucket(
            firebaseBucket,
            generated.buffer,
            destination,
            generated.mimeType
          );

          if (lookup?.dishKey && lookup.label) {
            await saveLibraryImage(coverImages, {
              dishKey: lookup.dishKey,
              label: lookup.label,
              imageUrl: finalImageUrl,
              embedding: lookup.embedding,
            });
          }
        } catch (uploadErr) {
          console.warn(
            '[RecipeService] Upload of generated cover failed:',
            (uploadErr as Error).message
          );
        }
      }
    }

    // 3. Stock fallback. The library lookup already resolved the dish name, so
    //    reuse it rather than paying for a second keyword call.
    if (!finalImageUrl) {
      const pexelsUrl = lookup?.label
        ? await fetchPexelsImage(lookup.label)
        : await getSuggestedCoverImageUrl(recipe);
      if (!pexelsUrl) return null;

      finalImageUrl = pexelsUrl;

      if (firebaseBucket) {
        try {
          const imageRes = await fetch(pexelsUrl);
          if (imageRes.ok) {
            const buffer = Buffer.from(await imageRes.arrayBuffer());
            finalImageUrl = await uploadBufferToBucket(
              firebaseBucket,
              buffer,
              `recipes/${recipeId.toString()}/cover-${Date.now()}.jpg`,
              'image/jpeg'
            );
          }
        } catch (firebaseErr) {
          console.warn(
            '[RecipeService] Firebase upload failed, falling back to direct Pexels URL:',
            (firebaseErr as Error).message
          );
        }
      }
    }

    await recipesCollection.updateOne(
      { _id: recipeId },
      { $set: { coverImageUrl: finalImageUrl, updatedAt: new Date() } }
    );
    return finalImageUrl;
  } catch (err) {
    console.error('[RecipeService] Failed to generate auto cover:', err);
    return null;
  }
}
