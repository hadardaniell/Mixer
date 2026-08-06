import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { ExtractFromTextResultSchema, type ExtractFromTextResult } from '@mixer/contracts';
import { retryWithBackoff, sanitizeJsonResponse } from '../../utils/retry.utils.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const recipeSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    isRecipe: { type: SchemaType.BOOLEAN },
    reason: {
      type: SchemaType.STRING,
      description: 'If isRecipe is false: "not_a_recipe" or "different_recipes"',
    },
    title: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    ingredients: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          amount: { type: SchemaType.NUMBER },
          unit: { type: SchemaType.STRING },
        },
        required: ['name'],
      },
    },
    steps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          order: { type: SchemaType.INTEGER },
          text: { type: SchemaType.STRING },
          durationMinutes: { type: SchemaType.INTEGER },
        },
        required: ['order', 'text'],
      },
    },
    servings: { type: SchemaType.INTEGER },
    prepTimeMinutes: { type: SchemaType.INTEGER },
    cookTimeMinutes: { type: SchemaType.INTEGER },
    difficulty: { type: SchemaType.STRING, description: 'One of: "easy", "medium", "hard"' },
    cuisine: { type: SchemaType.STRING },
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['isRecipe'],
};

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: recipeSchema,
    temperature: 0,
  },
});

// Gemini Vision reads images directly — no separate OCR step needed.
// Single API call replaces: Tesseract OCR × N images + same-recipe check + text extraction.
// Gemini handles Hebrew (and mixed Hebrew/English) far better than Tesseract.
const BASE_VISION_PROMPT = `You are a recipe extraction assistant.
You will receive one or more photos of a recipe (cookbook page, screenshot, handwritten card, etc.).
If multiple images are provided they should all show parts of the same recipe (different pages, angles, or sections).

Set isRecipe to true and fill in all recipe fields if a recipe is found.
Set isRecipe to false and set reason to "not_a_recipe" if the image has no recipe.
Set isRecipe to false and set reason to "different_recipes" if multiple images clearly show different recipes.

RULES:
- "difficulty" must always be one of: "easy", "medium", "hard" — in English.
- Ignore advertisements, blog links, social media elements, and unrelated text.
- Combine all images when multiple are provided to build the most complete recipe possible.`;

function buildPrompt(locale: string): string {
  const lang = locale === 'he' ? 'Hebrew (עברית)' : 'English';
  return `${BASE_VISION_PROMPT}\n- Output ALL text fields (title, description, ingredients, steps, tags, cuisine) in ${lang}, regardless of the language visible in the image.`;
}

export async function extractRecipeFromImages(
  images: Array<{ imageBase64: string; mimeType: string }>,
  locale = 'en',
): Promise<ExtractFromTextResult> {
  const result = await retryWithBackoff(
    () =>
      model.generateContent([
        buildPrompt(locale),
        ...images.map((img) => ({
          inlineData: { mimeType: img.mimeType, data: img.imageBase64 },
        })),
        images.length > 1
          ? 'Extract the complete recipe from all these photos combined.'
          : 'Extract the recipe from this photo.',
      ]),
    { retries: 3, initialDelayMs: 1000 },
  );

  const rawText = sanitizeJsonResponse(result.response.text());
  const parsed = JSON.parse(rawText) as Record<string, unknown>;

  if (parsed.isRecipe === false) {
    throw new Error(parsed.reason === 'different_recipes' ? 'images_not_same_recipe' : 'not_a_recipe');
  }

  return ExtractFromTextResultSchema.parse(parsed);
}

