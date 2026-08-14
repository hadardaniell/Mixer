import { config } from '../config.js';

type PexelsPhoto = {
  alt?: string;
  width?: number;
  height?: number;
  src?: { large?: string; medium?: string };
};

/** Photos whose alt text suggests they are not a plated dish. */
const OFF_TOPIC_TERMS = [
  'person',
  'people',
  'woman',
  'man',
  'child',
  'kitchen',
  'restaurant',
  'market',
  'chef',
  'menu',
  'sign',
  'text',
];

/**
 * Scores how well a photo matches the search terms.
 * Pexels orders by its own relevance, which for food queries routinely puts a
 * person-in-a-kitchen shot first — so the top result alone is not trustworthy.
 */
function scorePhoto(photo: PexelsPhoto, terms: string[]): number {
  const alt = (photo.alt ?? '').toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (alt.includes(term)) score += 2;
  }
  for (const term of OFF_TOPIC_TERMS) {
    if (alt.includes(term)) score -= 3;
  }

  // Prefer landscape: covers render in a wide frame, and portrait crops badly.
  if (photo.width && photo.height && photo.width >= photo.height) score += 1;

  return score;
}

export async function fetchPexelsImage(query: string): Promise<string | null> {
  const apiKey = config.pexelsApiKey || process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.warn('[Pexels] PEXELS_API_KEY is missing');
    return null;
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as { photos?: PexelsPhoto[] };
    const photos = (data.photos ?? []).filter((p) => p.src?.large || p.src?.medium);
    if (photos.length === 0) return null;

    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    // Stable pick: highest score wins, ties resolved by Pexels' original order.
    const best = photos.reduce((winner, candidate) =>
      scorePhoto(candidate, terms) > scorePhoto(winner, terms) ? candidate : winner
    );

    return best.src?.large ?? best.src?.medium ?? null;
  } catch (err) {
    console.error('[Pexels] Error fetching image:', err);
    return null;
  }
}
