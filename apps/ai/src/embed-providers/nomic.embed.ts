import type { EmbedProvider } from './embed.interface.js';

export class NomicEmbedProvider implements EmbedProvider {
  private readonly apiKey = process.env.NOMIC_API_KEY!;

  async embed(text: string): Promise<number[]> {
    const response = await fetch('https://api-atlas.nomic.ai/v1/embedding/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        texts: [text],
        model: 'nomic-embed-text-v1.5',
        task_type: 'search_document',
      }),
    });

    if (!response.ok) {
      throw new Error(`Nomic API error: ${response.status}`);
    }

    const data = await response.json() as { embeddings: number[][] };
    const embedding = data.embeddings[0];
    if (!embedding) throw new Error('Nomic returned empty embeddings');
    return embedding;
  }
}
