import Groq from 'groq-sdk';
import { ExtractFromTextResultSchema, type ExtractFromTextResult } from '@mixer/contracts';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a recipe extraction assistant.
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
Important: the input text may be in any language (including Hebrew). Keep title, description, ingredients, and steps in the same language as the input. However, the "difficulty" field must always be one of: "easy", "medium", "hard" — in English, regardless of input language.`;

export async function extractRecipeFromText(text: string): Promise<ExtractFromTextResult> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('AI returned invalid JSON');
  }

  if (parsed.isRecipe === false) {
    throw new Error('not_a_recipe');
  }

  return ExtractFromTextResultSchema.parse(parsed);
}
