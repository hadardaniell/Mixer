import { Collection, ObjectId } from 'mongodb';
import type { Bucket } from '@google-cloud/storage';
import { config } from '../../config.js';
import type { RecipeDoc } from '../../db/types.js'; 
import { fetchPexelsImage } from '../../services/pexels.service.js';

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

export async function getSuggestedCoverImageUrl(recipe: {
  title: string;
  description?: string;
  cuisine?: string;
  ingredients?: Array<{ name: string }>;
}): Promise<string | null> {
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

export async function generateAndStoreCoverImage(
  recipesCollection: Collection<RecipeDoc>,
  firebaseBucket: Bucket | null | undefined,
  recipeId: ObjectId,
  recipe: { title: string; description?: string; cuisine?: string; ingredients?: Array<{ name: string }> }
): Promise<string | null> {
  try {
    const pexelsUrl = await getSuggestedCoverImageUrl(recipe);
    if (!pexelsUrl) return null;

    let finalImageUrl = pexelsUrl;

    if (firebaseBucket) {
      try {
        const imageRes = await fetch(pexelsUrl);
        if (imageRes.ok) {
          const arrayBuffer = await imageRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const firebaseImageUrl = await uploadBufferToBucket(
            firebaseBucket,
            buffer,
            `recipes/${recipeId.toString()}/cover.jpg`,
            'image/jpeg'
          );
          if (firebaseImageUrl) {
            finalImageUrl = firebaseImageUrl;
          }
        }
      } catch (firebaseErr) {
        console.warn(
          '[RecipeService] Firebase upload failed, falling back to direct Pexels URL:',
          (firebaseErr as Error).message
        );
      }
    }

    if (finalImageUrl) {
      await recipesCollection.updateOne(
        { _id: recipeId },
        { $set: { coverImageUrl: finalImageUrl, updatedAt: new Date() } }
      );
    }
    return finalImageUrl;
  } catch (err) {
    console.error('[RecipeService] Failed to generate auto cover:', err);
    return null;
  }
}