import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

export const textLlamaService = {
  async extractRecipeFromText(text: string): Promise<any | null> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in the environment variables.');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const recipeSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, nullable: true },
        description: { type: SchemaType.STRING, nullable: true },
        ingredients: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              amount: { type: SchemaType.NUMBER, nullable: true },
              unit: { type: SchemaType.STRING, nullable: true },
            },
            required: ["name"],
          },
          description: 'List of all ingredients with their measurements.',
          nullable: true,
        },
        steps: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              order: { type: SchemaType.INTEGER },
              text: { type: SchemaType.STRING },
              durationMinutes: { type: SchemaType.INTEGER, nullable: true },
            },
            required: ["order", "text"],
          },
          description: 'Every single step of the recipe in strict chronological order. Do not summarize or abbreviate.',
          nullable: true,
        },
        prepTimeMinutes: { type: SchemaType.INTEGER, nullable: true },
        cookTimeMinutes: { type: SchemaType.INTEGER, nullable: true },
        servings: { type: SchemaType.INTEGER, nullable: true },
        difficulty: { type: SchemaType.STRING, description: 'Must be one of: "easy", "medium", "hard"', nullable: true },
        cuisine: { type: SchemaType.STRING, nullable: true },
        tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: true },
      },
      required: ['title'],
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: recipeSchema,
        maxOutputTokens: 8192,
      },
    });

    const prompt = `You are a recipe parser. Analyze the following text, which comes from the comment section of a video. Determine if a full recipe (with ingredients and steps) is present.
    
If a full recipe is found, extract it. If the text does NOT contain a full recipe, you MUST return a JSON object with a null "title".
Do not try to invent a recipe or fill in missing information. Extract EVERY SINGLE STEP and ingredient in full detail from beginning to end. DO NOT summarize.

Text to analyze:
"""
${text}
"""`;

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