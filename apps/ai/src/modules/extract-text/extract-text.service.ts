import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ExtractFromTextResultSchema,
  type ExtractFromTextResult,
} from '@mixer/contracts';
import { cleanNullValues, retryWithBackoff, sanitizeJsonResponse } from '../../utils/retry.utils.js';
import { fetchExternalRecipeImage } from '../../services/image-search.service.js';

let groqClient: Groq | undefined;

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is missing');
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
}

const BASE_PROMPT = `You are a recipe extraction assistant.
The user will give you raw text that may or may not contain a recipe.
First decide if the text contains a recipe. Then return a valid JSON object:

If it IS a recipe:
{
  "isRecipe": true,
  "title": string,
  "description": string (optional),
  "ingredients": [{ "name": string, "amount": number (optional), "unit": string (optional) }],
  "steps": [{ "order": number, "text": string, "durationMinutes": number (optional) }],
  "servings": number (optional),
  "prepTimeMinutes": number (optional),
  "cookTimeMinutes": number (optional),
  "difficulty": "easy" | "medium" | "hard" (optional),
  "cuisine": string (optional),
  "tags": string[] (optional)
}

If it is NOT a recipe (e.g. a news article, social media post, lyrics, random text):
{ "isRecipe": false }

Return ONLY the JSON object, no explanation, no markdown, no code blocks.
If a field cannot be determined from the text, omit it.
The "difficulty" field must always be one of: "easy", "medium", "hard" — in English.`;

function buildPrompt(locale: string): string {
  const lang = locale === 'he' ? 'Hebrew (עברית)' : 'English';
  return `${BASE_PROMPT}\nIMPORTANT: Output ALL text fields (title, description, ingredients, steps, tags, cuisine) in ${lang}, regardless of the language of the input text.`;
}

async function extractWithGeminiFallback(text: string, locale: string): Promise<Record<string, unknown>> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is missing');
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  });
  const response = await model.generateContent([buildPrompt(locale), text]);
  const cleaned = sanitizeJsonResponse(response.response.text());
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned) as Record<string, unknown>;
}

export async function extractRecipeFromText(
  text: string,
  locale = 'en',
): Promise<ExtractFromTextResult> {
  let parsed: Record<string, unknown>;

  try {
    const groq = getGroqClient();
    parsed = await retryWithBackoff(
      async (attempt) => {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: buildPrompt(locale) },
            { role: 'user', content: text },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('AI returned an empty response');
        }

        const cleaned = sanitizeJsonResponse(content);
        let jsonStr = cleaned;
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          jsonStr = match[0];
        }

        try {
          return JSON.parse(jsonStr) as Record<string, unknown>;
        } catch (err) {
          console.warn(`[extract-text] JSON parse error on attempt ${attempt}:`, cleaned.slice(0, 200));
          throw new Error('AI returned invalid JSON');
        }
      },
      { retries: 2, initialDelayMs: 800 },
    );
  } catch (groqErr) {
    console.warn(`[extract-text] Groq extraction failed (${groqErr instanceof Error ? groqErr.message : groqErr}). Falling back to Gemini...`);
    try {
      parsed = await extractWithGeminiFallback(text, locale);
    } catch (geminiErr) {
      console.error(`[extract-text] Gemini fallback also failed:`, geminiErr);
      throw groqErr;
    }
  }

  if (parsed.isRecipe === false) {
    throw new Error('not_a_recipe');
  }

  const cleanedObj = cleanNullValues(parsed) as Record<string, unknown>;
  if (!cleanedObj.coverImageUrl) {
    const title = typeof cleanedObj.title === 'string' ? cleanedObj.title : undefined;
    const cuisine = typeof cleanedObj.cuisine === 'string' ? cleanedObj.cuisine : undefined;
    const tags = Array.isArray(cleanedObj.tags) ? (cleanedObj.tags as string[]) : undefined;
    const ingredients = Array.isArray(cleanedObj.ingredients) ? (cleanedObj.ingredients as any[]) : undefined;
    cleanedObj.coverImageUrl = await fetchExternalRecipeImage(title, cuisine, tags, ingredients);
  }

  return ExtractFromTextResultSchema.parse(cleanedObj);
}