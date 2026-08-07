import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { ExtractFromTextResultSchema, type ExtractFromTextResult } from '@mixer/contracts';
import { cleanNullValues, retryWithBackoff, sanitizeJsonResponse } from '../../utils/retry.utils.js';
import { fetchExternalRecipeImage } from '../../services/image-search.service.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const recipeSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    isRecipe: { type: SchemaType.BOOLEAN },
    reason: {
      type: SchemaType.STRING,
      description: 'If isRecipe is false: "not_a_recipe" or "different_recipes"',
    },
    title: { type: SchemaType.STRING, description: 'Concise recipe title (max 10 words). No hashtags or SEO tag lists.' },
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

function getModel(modelName: string) {
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });
}

// Gemini Vision reads images directly — no separate OCR step needed.
// Single API call replaces: Tesseract OCR × N images + same-recipe check + text extraction.
// Gemini handles Hebrew (and mixed Hebrew/English) far better than Tesseract.
const BASE_VISION_PROMPT = `You are a recipe extraction assistant.
Analyze the image(s) provided and return ONLY a valid JSON object:

If it IS a recipe:
{
  "isRecipe": true,
  "title": "Short Clean Title (max 10 words, no hashtags or SEO keyword lists)",
  "description": "Optional description",
  "ingredients": [{ "name": "Ingredient name", "amount": 1.5, "unit": "cup" }],
  "steps": [{ "order": 1, "text": "Step instruction" }],
  "servings": 4,
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 30,
  "difficulty": "easy",
  "cuisine": "Italian",
  "tags": ["pasta", "dinner"]
}

If it is NOT a recipe (e.g. random photo, landscape, non-food image):
{ "isRecipe": false, "reason": "not_a_recipe" }

If multiple images show completely different recipes:
{ "isRecipe": false, "reason": "different_recipes" }

RULES:
- "difficulty" must always be one of: "easy", "medium", "hard" — in English.
- "title" MUST be concise and clean (under 10 words). DO NOT include hashtags or repeated SEO tag lists like "מתכונים ביחד מתכונים לשבת".
- Combine all images when multiple are provided to build the most complete recipe possible.`;

function buildPrompt(locale: string): string {
  const lang = locale === 'he' ? 'Hebrew (עברית)' : 'English';
  return `${BASE_VISION_PROMPT}\n- Output ALL text fields (title, description, ingredients, steps, tags, cuisine) in ${lang}, regardless of the language visible in the image.`;
}

export async function extractRecipeFromImages(
  images: Array<{ imageBase64: string; mimeType: string }>,
  locale = 'en',
): Promise<ExtractFromTextResult> {
  const modelsToTry = ['gemini-2.5-flash'];

  const parsed = await retryWithBackoff(
    async (attempt) => {
      const modelName = modelsToTry[(attempt - 1) % modelsToTry.length] ?? 'gemini-2.5-flash';
      const model = getModel(modelName);
      const response = await model.generateContent([
        buildPrompt(locale),
        ...images.map((img) => ({
          inlineData: { mimeType: img.mimeType, data: img.imageBase64 },
        })),
        images.length > 1
          ? 'Extract the complete recipe from all these photos combined.'
          : 'Extract the recipe from this photo.',
      ]);

      let rawText = sanitizeJsonResponse(response.response.text());
      try {
        let jsonStr = rawText;
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          jsonStr = match[0];
        }
        const obj = JSON.parse(jsonStr) as Record<string, unknown>;
        if (typeof obj.title === 'string' && obj.title.length > 150) {
          obj.title = obj.title.split('-')[0]?.trim().slice(0, 100) || obj.title.slice(0, 100);
        }
        return obj;
      } catch (err) {
        console.warn(`[extract-image] JSON parse error on attempt ${attempt} (raw length ${rawText.length}):`, rawText.slice(0, 200));
        throw new Error('AI returned invalid JSON');
      }
    },
    { retries: 3, initialDelayMs: 1500 },
  );

  if (parsed.isRecipe === false) {
    throw new Error(parsed.reason === 'different_recipes' ? 'images_not_same_recipe' : 'not_a_recipe');
  }

  const cleaned = cleanNullValues(parsed) as Record<string, unknown>;
  if (!cleaned.coverImageUrl) {
    const title = typeof cleaned.title === 'string' ? cleaned.title : undefined;
    const cuisine = typeof cleaned.cuisine === 'string' ? cleaned.cuisine : undefined;
    const tags = Array.isArray(cleaned.tags) ? (cleaned.tags as string[]) : undefined;
    const ingredients = Array.isArray(cleaned.ingredients) ? (cleaned.ingredients as any[]) : undefined;
    cleaned.coverImageUrl = await fetchExternalRecipeImage(title, cuisine, tags, ingredients);
  }

  return ExtractFromTextResultSchema.parse(cleaned);
}

