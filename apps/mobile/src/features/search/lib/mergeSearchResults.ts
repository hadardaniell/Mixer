interface SearchItem {
  id: string;
  [key: string]: unknown;
}

/**
 * Merges semantic and text search results: semantic results appear first
 * (AI-ranked by relevance), then any text-only matches not already included.
 */
export function mergeSearchResults<T extends SearchItem>(
  semanticItems: T[],
  textItems: T[],
): T[] {
  const seenIds = new Set(semanticItems.map((r) => r.id));
  return [...semanticItems, ...textItems.filter((r) => !seenIds.has(r.id))];
}
