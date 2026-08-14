import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'node:fs';
import { cleanNullValues, retryWithBackoff, sanitizeJsonResponse } from './utils/retry.utils.js';

const recipeSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    isRecipe: {
      type: SchemaType.BOOLEAN,
      description: 'Set to false if this video is NOT a recipe (e.g. a vlog, interview, music video, or non-food content). Set to true if it contains a recipe.',
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
      description: 'List of all ingredients with their measurements.',
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
      description: 'Every single step of the recipe in strict chronological order. Do not summarize or abbreviate.',
    },
    prepTimeMinutes: { type: SchemaType.INTEGER },
    cookTimeMinutes: { type: SchemaType.INTEGER },
    servings: { type: SchemaType.INTEGER },
    difficulty: { type: SchemaType.STRING, description: 'Must be one of: "easy", "medium", "hard"' },
    cuisine: { type: SchemaType.STRING },
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['isRecipe', 'title', 'description', 'ingredients', 'steps'],
};

const RECIPE_PROMPT = `You are a professional chef and video analyst. Analyze the video content provided.
First determine if this is a recipe video (it must show food being prepared with ingredients and steps). Set "isRecipe" to true only if it clearly contains a recipe. Set it to false for vlogs, interviews, restaurant reviews, food tours, or anything without clear cooking instructions.
If it IS a recipe: transcribe any spoken words, and carefully describe all visual instructions, ingredients, and measurements shown. Extract EVERY SINGLE STEP in full detail from beginning to end. DO NOT summarize.
If it is NOT a recipe: set isRecipe to false and leave all other fields empty.`;

function getModel(apiKey: string) {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: recipeSchema,
      temperature: 0.1,
    },
  });
}

function assertRecipe(parsed: any): any {
  if (parsed.isRecipe === false) throw new Error('not_a_recipe');
  return parsed;
}

export const videoLlamaService = {
  // For TikTok / Instagram / other platforms — download frames first, then send to Gemini
  async extractRecipe(audioPath: string, framePaths: string[], locale?: string): Promise<any> {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');

    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
    const model = getModel(process.env.GEMINI_API_KEY);

    let audioRes: any;
    if (fs.existsSync(audioPath)) {
      audioRes = await retryWithBackoff(
        () => fileManager.uploadFile(audioPath, { mimeType: 'audio/mp3', displayName: 'Recipe Audio' }),
        { retries: 3, initialDelayMs: 1000 },
      ).catch(() => undefined);
    }

    // Convert lightweight 480p frames to inline base64 data to eliminate 12 separate File API HTTP round-trips
    const frameParts = await Promise.all(
      framePaths.map(async (framePath) => {
        const buffer = await fs.promises.readFile(framePath);
        return {
          inlineData: {
            mimeType: 'image/jpeg',
            data: buffer.toString('base64'),
          },
        };
      }),
    );

    const parts: any[] = [...frameParts];
    if (audioRes) {
      parts.unshift({ fileData: { mimeType: audioRes.file.mimeType, fileUri: audioRes.file.uri } });
    }

    try {
      const prompt = locale
        ? `${RECIPE_PROMPT}\n\nIMPORTANT: All extracted text (title, description, ingredients, steps, etc.) MUST BE written in the language locale: "${locale}". Translate from the video's language if necessary. DO NOT translate the "difficulty" field; it MUST remain "easy", "medium", or "hard".`
        : RECIPE_PROMPT;

      const result = await retryWithBackoff(
        () => model.generateContent([...parts, { text: prompt }]),
        { retries: 3, initialDelayMs: 1500 },
      );

      if (result.response.usageMetadata) {
        console.log(`📊 [Video AI] Tokens: ${result.response.usageMetadata.totalTokenCount} total`);
      }

      const rawText = sanitizeJsonResponse(result.response.text());
      const parsedRecipe = assertRecipe(cleanNullValues(JSON.parse(rawText)));
      // Cover images are the API's responsibility — see extract-text.service.ts.
      return parsedRecipe;
    } finally {
      if (audioRes) {
        fileManager.deleteFile(audioRes.file.name).catch(() => { });
      }
    }
  },
};

