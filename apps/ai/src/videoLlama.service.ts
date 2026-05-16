import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

export const videoLlamaService = {
  async extractRecipe(mediaPath: string): Promise<any> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in the environment variables.');
    }

    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const uploadResult = await fileManager.uploadFile(mediaPath, {
      mimeType: 'video/mp4',
      displayName: 'Recipe Video',
    });

    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === 'PROCESSING') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await fileManager.getFile(uploadResult.file.name);
    }
    if (file.state === 'FAILED') throw new Error('Video processing failed on Gemini servers.');

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    
    const prompt = `You are a professional chef. Watch this video and transcribe any spoken words, and carefully describe all visual instructions, ingredients, and measurements shown on screen.
    
    The output JSON must strictly match this structure:
    {
      "title": "Recipe Title",
      "description": "Short description of the recipe",
      "ingredients": ["1 cup sugar", "2 eggs"],
      "steps": ["Step 1...", "Step 2..."],
      "prepTimeMinutes": 10,
      "cookTimeMinutes": 20,
      "servings": 4
    }`;
    
    const result = await model.generateContent([{ fileData: { mimeType: uploadResult.file.mimeType, fileUri: uploadResult.file.uri } }, { text: prompt }]);
    await fileManager.deleteFile(uploadResult.file.name).catch(() => {});

    return JSON.parse(result.response.text());
  }
};