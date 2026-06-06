import type { EmbedProvider } from './embed.interface.js';

// To activate: set OPENAI_API_KEY in apps/ai/.env
// and replace NomicEmbedProvider with OpenAiEmbedProvider in embed.service.ts
export class OpenAiEmbedProvider implements EmbedProvider {
  private readonly apiKey = process.env.OPENAI_API_KEY!;

  async embed(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> };
    const result = data.data[0];
    if (!result) throw new Error('OpenAI returned empty embeddings');
    return result.embedding;
  }
}
