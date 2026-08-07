// apps/ai/src/modules/translate/translate.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { sanitizeJsonResponse } from '../../utils/retry.utils.js';

function parseJsonFromAiText<T>(rawText: string): T {
  const cleaned = sanitizeJsonResponse(rawText);
  const match = cleaned.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : cleaned;
  return JSON.parse(jsonStr) as T;
}

async function translateWithGroq<T>(prompt: string): Promise<T> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
  });
  const content = completion.choices[0]?.message?.content ?? '{}';
  return parseJsonFromAiText<T>(content);
}

export interface RecipeToTranslate {
  title: string;
  description?: string;
  tags?: string[]; 
  cuisine?: string;
  ingredients: Array<{
    name: string;
    amount?: number;
    unit?: string;
    note?: string;
  }>;
  steps: Array<{
    order: number;
    text: string;
    durationMinutes?: number;
  }>;
}

export interface TranslateBookInput {
  name: string;
  description?: string;
}

export async function translateRecipeWithGemini(
  recipe: RecipeToTranslate,
  targetLanguage: 'he' | 'en'
): Promise<RecipeToTranslate> {
  const languageName = targetLanguage === 'he' ? 'Hebrew' : 'English';

  const prompt = `
    You are an expert culinary translator.
    Translate all text fields (title, description, tags, ingredient names, ingredient units, ingredient notes, step text) of the following recipe into ${languageName}.
    
    Rules for Cuisine:
  - Translate the cuisine type accurately into ${languageName} (e.g., 'American' -> 'אמריקאי', 'Italian' -> 'איטלקי', 'Asian' -> 'אסיאתי').

    Rules for Tags:
    - For array fields like 'tags', translate every string element within the array into ${languageName} while preserving the array structure.

    Rules for Units:
    - Expand and translate single-letter and abbreviated measurement units accurately into ${languageName}.
    - English to Hebrew unit mappings:
      * 'g' / 'gr' -> 'גרם'
      * 'kg' -> 'ק"ג'
      * 'ml' -> 'מ"ל'
      * 'l' / 'ltr' -> 'ליטר'
      * 'tsp' -> 'כפית'
      * 'tbsp' -> 'כף'
      * 'cup' / 'cups' -> 'כוס' / 'כוסות'
      * 'oz' -> 'אונקיה'
      * 'lb' / 'lbs' -> 'פאונד'
      * 'pinch' -> 'קורט'
    - Hebrew to English unit mappings:
      * 'גרם' / 'גר'' -> 'g'
      * 'ק"ג' -> 'kg'
      * 'מ"ל' -> 'ml'
      * 'ליטר' -> 'l'
      * 'כפית' / 'כפיות' -> 'tsp'
      * 'כף' / 'כפות' -> 'tbsp'
      * 'כוס' / 'כוסות' -> 'cups'
      * 'קורט' -> 'pinch'

    General Rules:
    - Keep numeric amounts, order numbers, and durations unchanged.
    - Return ONLY valid JSON matching the exact same schema.

    Recipe:
    ${JSON.stringify(recipe)}
  `;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const response = await model.generateContent(prompt);
      const responseText = response.response.text();
      return parseJsonFromAiText<RecipeToTranslate>(responseText);
    }
  } catch (err) {
    console.warn('[Translate] Gemini translation failed — falling back to Groq:', err instanceof Error ? err.message : err);
  }

  return translateWithGroq<RecipeToTranslate>(prompt);
}

export async function translateBookWithGemini(
  book: TranslateBookInput,
  targetLanguage: 'he' | 'en'
): Promise<TranslateBookInput> {
  const languageName = targetLanguage === 'he' ? 'Hebrew' : 'English';

  const prompt = `Translate the following recipe book title and description into ${languageName}.
Maintain the exact structure and return JSON matching this schema:
{
  "name": "translated name",
  "description": "translated description or null if original was empty"
}

Original Book Data:
${JSON.stringify(book, null, 2)}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const response = await model.generateContent(prompt);
      const text = response.response.text();
      return parseJsonFromAiText<TranslateBookInput>(text);
    }
  } catch (err) {
    console.warn('[Translate] Gemini book translation failed — falling back to Groq:', err instanceof Error ? err.message : err);
  }

  return translateWithGroq<TranslateBookInput>(prompt);
}