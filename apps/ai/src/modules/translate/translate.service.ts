// apps/ai/src/modules/translate/translate.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export interface RecipeToTranslate {
  title: string;
  description?: string;
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

export async function translateRecipeWithGemini(
  recipe: RecipeToTranslate,
  targetLanguage: 'he' | 'en'
): Promise<RecipeToTranslate> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const languageName = targetLanguage === 'he' ? 'Hebrew' : 'English';

  const prompt = `
    You are an expert culinary translator.
    Translate all text fields (title, description, ingredient names, ingredient units, ingredient notes, step text) of the following recipe into ${languageName}.
    
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

  const response = await model.generateContent(prompt);
  const responseText = response.response.text();

  return JSON.parse(responseText) as RecipeToTranslate;
}