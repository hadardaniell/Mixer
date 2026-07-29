import { config } from '../config.js';

export async function fetchPexelsImage(query: string): Promise<string | null> {
  const apiKey = config.pexelsApiKey || process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.warn('[Pexels] PEXELS_API_KEY is missing');
    return null;
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as {
      photos?: Array<{ src?: { large?: string; medium?: string } }>;
    };

    return data.photos?.[0]?.src?.large ?? data.photos?.[0]?.src?.medium ?? null;
  } catch (err) {
    console.error('[Pexels] Error fetching image:', err);
    return null;
  }
}