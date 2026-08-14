/**
 * The cover-image library.
 *
 * Generating an image costs money and seconds, and a large share of recipes are
 * the same handful of dishes — twenty people import "pasta rosa" and each one
 * would otherwise trigger its own generation. So images are filed by *dish*,
 * not by recipe, and reused.
 *
 * A lookup goes through three gates, cheapest first:
 *   1. Exact dish key — a string comparison, no AI, no network.
 *   2. Embedding similarity — catches "beef meatballs tomato" vs "tomato beef
 *      meatballs", which are the same dish with different word order.
 *   3. Generation — only when the dish is genuinely new to the library.
 */
import type { Collection } from 'mongodb';
import { ObjectId } from 'mongodb';

import { config } from '../../config.js';
import type { CoverImageDoc } from '../../db/types.js';
import { cosineSimilarity } from './search.utils.js';

export type CoverLibraryRecipe = {
  title: string;
  description?: string;
  cuisine?: string;
  ingredients?: Array<{ name: string }>;
};

/**
 * How close two dish names must be to share an image.
 *
 * Deliberately strict. A false positive here is worse than a wasted generation:
 * it puts a picture of the wrong food on someone's recipe, which is the exact
 * complaint the whole feature exists to fix. 0.93 keeps word-order and
 * pluralisation variants together while separating "chocolate loaf cake" from
 * "chocolate mousse cake".
 */
export const DISH_MATCH_THRESHOLD = 0.93;

/**
 * Normalizes a dish name into a lookup key: lowercase, no punctuation, single
 * dashes. "Pasta Rosa!" and "pasta  rosa" collapse to the same key.
 */
export function toDishKey(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

/** Asks the AI service for the canonical English dish name (2-3 words). */
async function resolveDishLabel(recipe: CoverLibraryRecipe): Promise<string | null> {
  try {
    const res = await fetch(`${config.aiBaseUrl}/suggest-keyword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: recipe.title,
        description: recipe.description,
        cuisine: recipe.cuisine,
        ingredients: recipe.ingredients,
      }),
    });
    if (!res.ok) return null;
    const { keyword } = (await res.json()) as { keyword?: string };
    return keyword?.trim() || null;
  } catch (err) {
    console.warn('[CoverLibrary] Failed to resolve dish label:', (err as Error).message);
    return null;
  }
}

async function embedLabel(label: string): Promise<number[] | null> {
  try {
    const res = await fetch(`${config.aiBaseUrl}/embed/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: label }),
    });
    if (!res.ok) return null;
    const { embedding } = (await res.json()) as { embedding?: number[] };
    return embedding?.length ? embedding : null;
  } catch (err) {
    console.warn('[CoverLibrary] Failed to embed dish label:', (err as Error).message);
    return null;
  }
}

async function markUsed(
  coverImages: Collection<CoverImageDoc>,
  _id: ObjectId,
): Promise<void> {
  await coverImages
    .updateOne({ _id }, { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } })
    .catch(() => {});
}

export type DishLookup = {
  /** Canonical dish name, e.g. "Pasta rosa". Null when the AI service is down. */
  label: string | null;
  dishKey: string | null;
  /** A library image to reuse, if this dish is already covered. */
  imageUrl: string | null;
  /** Embedding of `label`, so the caller can store it if it generates. */
  embedding: number[] | null;
};

/**
 * Resolves a recipe to its dish and, when possible, to an image already in the
 * library. Returns `imageUrl: null` when the dish is new and must be generated.
 */
export async function findLibraryImage(
  coverImages: Collection<CoverImageDoc>,
  recipe: CoverLibraryRecipe,
): Promise<DishLookup> {
  const label = await resolveDishLabel(recipe);
  if (!label) return { label: null, dishKey: null, imageUrl: null, embedding: null };

  const dishKey = toDishKey(label);
  if (!dishKey) return { label, dishKey: null, imageUrl: null, embedding: null };

  // Gate 1 — exact key.
  const exact = await coverImages.findOne({ dishKey });
  if (exact) {
    await markUsed(coverImages, exact._id);
    return { label, dishKey, imageUrl: exact.imageUrl, embedding: null };
  }

  // Gate 2 — nearest dish by meaning.
  const embedding = await embedLabel(label);
  if (embedding) {
    // The library is small (one doc per distinct dish) and each doc is a short
    // label plus a vector, so a full scan is cheaper than maintaining a vector
    // index. Revisit if it grows past a few thousand entries.
    const candidates = await coverImages
      .find({ embedding: { $exists: true } }, { projection: { imageUrl: 1, embedding: 1 } })
      .toArray();

    let best: { doc: (typeof candidates)[number]; score: number } | null = null;
    for (const doc of candidates) {
      if (!doc.embedding?.length) continue;
      const score = cosineSimilarity(embedding, doc.embedding);
      if (!best || score > best.score) best = { doc, score };
    }

    if (best && best.score >= DISH_MATCH_THRESHOLD) {
      await markUsed(coverImages, best.doc._id);
      return { label, dishKey, imageUrl: best.doc.imageUrl, embedding };
    }
  }

  return { label, dishKey, imageUrl: null, embedding };
}

/**
 * Files a freshly generated image under its dish so the next recipe for the
 * same dish reuses it.
 *
 * Upserts on `dishKey`: two recipes for a new dish can be created concurrently,
 * both miss the lookup, and both generate. The second write must not blow up on
 * the unique index — it just overwrites, and one of the two images wins.
 */
export async function saveLibraryImage(
  coverImages: Collection<CoverImageDoc>,
  entry: { dishKey: string; label: string; imageUrl: string; embedding: number[] | null },
): Promise<void> {
  const now = new Date();
  await coverImages
    .updateOne(
      { dishKey: entry.dishKey },
      {
        $set: {
          label: entry.label,
          imageUrl: entry.imageUrl,
          lastUsedAt: now,
          ...(entry.embedding ? { embedding: entry.embedding } : {}),
        },
        $setOnInsert: { dishKey: entry.dishKey, createdAt: now },
        $inc: { usageCount: 1 },
      },
      { upsert: true },
    )
    .catch((err) => {
      console.warn('[CoverLibrary] Failed to file generated image:', (err as Error).message);
    });
}
