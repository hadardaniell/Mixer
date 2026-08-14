/**
 * Recipe Cover Image Generation
 *
 * Generates a photorealistic cover image for a recipe with Gemini's image model,
 * instead of searching a stock library. Stock search can only ever match the
 * recipe's *category* ("chocolate cake"), which is why generic photos kept
 * landing on specific recipes; generation works off the actual dish.
 *
 * Two steps: a text model turns the recipe into a food-photography brief, then
 * the image model renders it. Splitting them lets the text model do the culinary
 * reasoning (what does this dish physically look like when finished?) that the
 * image model is weak at.
 */

const TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GenerateImageInput {
  title: string;
  description?: string;
  cuisine?: string;
  ingredients?: Array<{ name: string }>;
  steps?: Array<{ text: string }>;
  tags?: string[];
}

export interface GeneratedImage {
  /** Raw image bytes, base64-encoded. */
  data: string;
  mimeType: string;
}

/** Photography direction applied to every recipe, whatever the dish. */
const PHOTO_DIRECTION = [
  'Photorealistic food photography of the finished, plated dish, ready to eat.',
  'Shot at a 45-degree angle on a neutral surface, soft natural window light from the side, shallow depth of field.',
  'Landscape orientation, the dish centered and filling most of the frame.',
  'Absolutely no text, letters, words, logos, labels, packaging or watermarks anywhere in the image.',
  'No hands, no people, no cutlery in motion, no raw ingredients scattered around, no recipe cards.',
].join(' ');

/**
 * Asks the text model to describe what this specific dish looks like when
 * finished — form, color, texture, plating — rather than naming its category.
 */
async function buildPhotoBrief(recipe: GenerateImageInput, apiKey: string): Promise<string> {
  const prompt = `
You are a food stylist writing a brief for a photographer. Read the recipe and describe what THIS dish looks like once finished and plated.

Title: ${recipe.title}
Description: ${recipe.description ?? 'N/A'}
Cuisine: ${recipe.cuisine ?? 'N/A'}
Tags: ${recipe.tags?.slice(0, 6).join(', ') ?? 'N/A'}
Ingredients: ${recipe.ingredients?.map((i) => i.name).slice(0, 15).join(', ') ?? 'N/A'}
Method: ${recipe.steps?.map((s) => s.text).slice(0, 8).join(' ') ?? 'N/A'}

The recipe may be written in Hebrew. Write your answer in English regardless.

Infer from the ingredients and method — not just the title — the physical result:
- Form and cut: whole / sliced / individual portions / in a pan / in a bowl. A batter poured into a loaf pan is a loaf; the same batter in a ring pan is a bundt.
- Surface and color: browned crust, glossy glaze, dusting of powdered sugar, melted cheese, charred edges, sauce coating.
- Texture cues visible from outside: crisp, creamy, flaky, crumbly, juicy.
- Visible inclusions: nuts, herbs, seeds, chocolate chunks, vegetable pieces — only if the recipe actually contains them.
- Serving vessel that fits the dish and the cuisine.

Rules:
- 2-4 sentences, plain descriptive prose. No lists, no headings, no markdown.
- Describe only the food and its plate. Never mention cameras, lenses, lighting or mood words.
- Never invent an ingredient that is not in the recipe.
- Do not use words like "delicious", "gourmet" or "mouth-watering".
`.trim();

  const res = await fetch(`${API_BASE}/${TEXT_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
  });

  if (!res.ok) {
    throw new Error(`Gemini brief failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const brief = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();

  // Falling back to the bare title still beats failing the whole generation.
  return brief || recipe.title;
}

async function postImageRequest(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${API_BASE}/${IMAGE_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function renderImage(brief: string, apiKey: string): Promise<GeneratedImage> {
  const contents = [{ role: 'user', parts: [{ text: `${brief}\n\n${PHOTO_DIRECTION}` }] }];

  let res = await postImageRequest(apiKey, {
    contents,
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '16:9' },
    },
  });

  // `imageConfig` / `responseModalities` are newer fields and a given API
  // version may reject them outright (400). A square image is far better than
  // no image, so retry bare before giving up — but only for a request error,
  // never for auth or quota failures, which a retry cannot fix.
  if (res.status === 400) {
    const detail = await res.text();
    console.warn(`[generate-image] Retrying without generationConfig after 400: ${detail}`);
    res = await postImageRequest(apiKey, { contents });
  }

  if (!res.ok) {
    throw new Error(`Gemini image failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
    }>;
  };

  const inline = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (!inline?.data) {
    throw new Error('Gemini image response contained no image data');
  }

  return { data: inline.data, mimeType: inline.mimeType ?? 'image/png' };
}

export async function generateRecipeImage(recipe: GenerateImageInput): Promise<GeneratedImage> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing');
  }

  const brief = await buildPhotoBrief(recipe, apiKey);
  return await renderImage(brief, apiKey);
}
