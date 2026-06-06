import type { EmbedProvider } from './embed.interface.js';

export class JinaEmbedProvider implements EmbedProvider {
  private readonly apiKey = process.env.JINA_API_KEY!;

  async embed(text: string): Promise<number[]> {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v3',
        input: [text],
        task: 'text-matching',
      }),
    });

    if (!response.ok) {
      throw new Error(`Jina API error: ${response.status}`);
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> };
    const result = data.data[0];
    if (!result) throw new Error('Jina returned empty embedding');
    return result.embedding;
  }
}
