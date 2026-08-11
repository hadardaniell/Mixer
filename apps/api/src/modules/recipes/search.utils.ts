export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export function escapeRegex(q: string): string {
  return q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type AnyFilter = Record<string, unknown>;

/**
 * Adds a substring search condition to an existing MongoDB filter.
 * If the filter already has a top-level $or (e.g. from visibility rules),
 * combining a second $or would silently overwrite the first — so we wrap
 * both inside $and instead.
 */
export function applySearchFilter(filter: AnyFilter, q: string): AnyFilter {
  const escaped = escapeRegex(q);
  const searchOr = [
    { title: { $regex: escaped, $options: 'i' } },
    { tags: { $regex: escaped, $options: 'i' } },
    { description: { $regex: escaped, $options: 'i' } },
  ];

  if (filter.$or) {
    return { ...filter, $and: [{ $or: filter.$or }, { $or: searchOr }], $or: undefined };
  }
  return { ...filter, $or: searchOr };
}
