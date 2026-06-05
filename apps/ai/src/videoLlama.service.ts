import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'node:fs';

export const videoLlamaService = {
  async extractRecipe(audioPath: string, framePaths: string[]): Promise<any> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in the environment variables.');
    }

    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Upload frames and audio concurrently
    const uploadPromises = framePaths.map((framePath, i) =>
      fileManager.uploadFile(framePath, { mimeType: 'image/jpeg', displayName: `Frame ${i + 1}` })
    );

    if (fs.existsSync(audioPath)) {
      uploadPromises.unshift(
        fileManager.uploadFile(audioPath, { mimeType: 'audio/mp3', displayName: 'Recipe Audio' })
      );
    }

    const uploadResults = await Promise.all(uploadPromises);

    const recipeSchema = {
      type: SchemaType.OBJECT,
      properties: {
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
            required: ["name"],
          },
          description: "List of all ingredients with their measurements.",
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
            required: ["order", "text"],
          },
          description: "Every single step of the recipe in strict chronological order. Do not summarize or abbreviate.",
        },
        prepTimeMinutes: { type: SchemaType.INTEGER },
        cookTimeMinutes: { type: SchemaType.INTEGER },
        servings: { type: SchemaType.INTEGER },
        difficulty: { type: SchemaType.STRING, description: 'Must be one of: "easy", "medium", "hard"' },
        cuisine: { type: SchemaType.STRING },
        tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ["title", "description", "ingredients", "steps"],
    };

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: { 
        responseMimeType: 'application/json',
        responseSchema: recipeSchema
      }
    });
    
    const prompt = `You are a professional chef. You are provided with the audio track and a sequence of extracted frames from a recipe video. Transcribe any spoken words, and carefully describe all visual instructions, ingredients, and measurements shown. Extract EVERY SINGLE STEP in full detail from beginning to end. DO NOT summarize.`;
    
    const parts = uploadResults.map((res) => ({
      fileData: { mimeType: res.file.mimeType, fileUri: res.file.uri }
    }));

    const result = await model.generateContent([...parts, { text: prompt }]);
    
    if (result.response.usageMetadata) {
      console.log('\n======================================================');
      console.log(`📊 [Video AI] Token Usage: ${result.response.usageMetadata.totalTokenCount} total`);
      console.log(`   Prompt: ${result.response.usageMetadata.promptTokenCount} | Completion: ${result.response.usageMetadata.candidatesTokenCount}`);
      console.log('======================================================\n');
    }

    // Cleanup all files from Gemini servers
    await Promise.all(uploadResults.map(res => fileManager.deleteFile(res.file.name).catch(() => {})));

    return JSON.parse(result.response.text());
  }
};