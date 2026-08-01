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

export async function generateAndStoreCoverImage(
  recipesCollection: Collection<RecipeDoc>,
  firebaseBucket: Bucket,
  recipeId: ObjectId,
  recipe: { title: string; description?: string; cuisine?: string; ingredients?: Array<{ name: string }> }
): Promise<void> {
  const pexelsKey = config.pexelsApiKey || process.env.PEXELS_API_KEY;
  if (!pexelsKey) {
    // Pexels API key is not configured — skip background stock cover fetching
    return;
  }

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

    if (!aiResponse.ok) return;
    const { keyword } = (await aiResponse.json()) as { keyword: string };
    if (!keyword) return;

    const pexelsUrl = await fetchPexelsImage(keyword);
    if (!pexelsUrl) return;

    const imageRes = await fetch(pexelsUrl);
    if (!imageRes.ok) return;
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const firebaseImageUrl = await uploadBufferToBucket(
      firebaseBucket,
      buffer,
      `recipes/${recipeId.toString()}/cover.jpg`,
      'image/jpeg'
    );

    if (firebaseImageUrl) {
      await recipesCollection.updateOne(
        { _id: recipeId },
        { $set: { coverImageUrl: firebaseImageUrl, updatedAt: new Date() } }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('default credentials')) {
      console.warn('[RecipeService] Firebase Storage credentials missing — skipped uploading auto cover');
    } else {
      console.error('[RecipeService] Failed to upload auto cover to Firebase:', message);
    }
  }
}