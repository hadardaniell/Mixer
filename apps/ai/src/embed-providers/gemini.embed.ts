import type { EmbedProvider } from './embed.interface.js';

export class GeminiEmbedProvider implements EmbedProvider {
  private readonly apiKey = process.env.GEMINI_API_KEY!;

  async embed(text: string): Promise<number[]> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/embedding-001',
          content: { parts: [{ text }] },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini Embedding API error: ${response.status}`);
    }

    const data = await response.json() as { embedding: { values: number[] } };
    const values = data.embedding?.values;
    if (!values) throw new Error('Gemini returned empty embedding');
    return values;
  }
}
