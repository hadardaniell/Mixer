import Groq from 'groq-sdk';
import { ExtractFromTextResultSchema, type ExtractFromTextResult } from '@mixer/contracts';
import { TesseractOcrProvider } from '../../ocr/tesseract.ocr.js';
// To switch to Google Vision: replace the line above with:
// import { GoogleVisionOcrProvider } from '../../ocr/google-vision.ocr.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ocr = new TesseractOcrProvider();
// To switch to Google Vision: const ocr = new GoogleVisionOcrProvider();

const RECIPE_EXTRACTION_PROMPT = `You are a recipe extraction assistant.
The user will give you raw text extracted from an image — it may contain some OCR noise or extra content.
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

If it is NOT a recipe (e.g. a meme, screenshot, product photo, random text):
{ "isRecipe": false }

IMPORTANT RULES:
- Ignore ALL advertisements, sponsored content, social media links, blog links, or calls to action.
- The recipe title must come ONLY from the main heading of the recipe.
- Steps must be actual cooking instructions only.
- Keep title, description, ingredients, and steps in the same language as the input text.
- The "difficulty" field must always be one of: "easy", "medium", "hard" — in English.
Return ONLY the JSON object, no explanation, no markdown, no code blocks.
If a field cannot be determined from the text, omit it.`;

const SAME_RECIPE_CHECK_PROMPT = `You are given multiple blocks of text, each extracted from a different image.
Determine if all blocks belong to the same recipe by checking:
- Ingredient consistency (ingredients mentioned in one block match others)
- The content makes sense as one dish (not completely unrelated foods)
- Same visual style hints in the text structure

Reply with exactly one word: "yes" if they belong to the same recipe, "no" if they do not.`;

export async function extractRecipeFromImages(
  images: Array<{ imageBase64: string; mimeType: string }>,
): Promise<ExtractFromTextResult> {
  const extractedTexts = await Promise.all(
    images.map((img) => ocr.extractText(img.imageBase64, img.mimeType)),
  );

  if (images.length > 1) {
    const checkCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SAME_RECIPE_CHECK_PROMPT },
        {
          role: 'user',
          content: extractedTexts.map((t, i) => `[Image ${i + 1}]\n${t}`).join('\n\n'),
        },
      ],
      temperature: 0,
    });

    const answer = checkCompletion.choices[0]?.message?.content?.trim().toLowerCase();
    if (answer === 'no') {
      throw new Error('images_not_same_recipe');
    }
  }

  const combinedText = extractedTexts.join('\n\n');

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: RECIPE_EXTRACTION_PROMPT },
      { role: 'user', content: combinedText },
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
