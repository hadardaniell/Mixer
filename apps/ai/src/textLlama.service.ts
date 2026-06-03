import { GoogleGenerativeAI } from '@google/generative-ai';

export const textLlamaService = {
  async extractRecipeFromText(text: string): Promise<any | null> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in the environment variables.');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `You are a recipe parser. Analyze the following text, which comes from the comment section of a video. Determine if a full recipe (with ingredients and steps) is present.
    
If a full recipe is found, extract it into the following JSON structure.
If the text does NOT contain a full recipe, return a JSON object with a null "title", like this: { "title": null }. Do not try to invent a recipe or fill in missing information.

Text to analyze:
"""
${text}
"""

JSON structure to use if a recipe is found:
{
  "title": "Recipe Title",
  "description": "Short description of the recipe",
  "ingredients": ["1 cup sugar", "2 eggs"],
  "steps": ["Step 1...", "Step 2..."],
  "prepTimeMinutes": 10,
  "cookTimeMinutes": 20,
  "servings": 4
}`;

    const result = await model.generateContent(prompt);
    
    if (result.response.usageMetadata) {
      console.log('\n======================================================');
      console.log(`📊 [Text AI] Token Usage: ${result.response.usageMetadata.totalTokenCount} total`);
      console.log(`   Prompt: ${result.response.usageMetadata.promptTokenCount} | Completion: ${result.response.usageMetadata.candidatesTokenCount}`);
      console.log('======================================================\n');
    } else {
      console.log('\n======================================================');
      console.log('⚠️ [Text AI] No usageMetadata returned from Gemini API!');
      console.log('======================================================\n');
    }

    const recipe = JSON.parse(result.response.text());

    return recipe && recipe.title ? recipe : null;
  },
};