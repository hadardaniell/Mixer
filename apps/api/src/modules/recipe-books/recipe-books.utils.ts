import type { RecipeBookDoc } from '../../db/types.js';

export function memberRole(book: RecipeBookDoc, userId: string): 'owner' | 'editor' | 'viewer' | null {
  if (book.ownerId.toString() === userId) return 'owner';
  const m = book.members.find((m) => m.userId.toString() === userId);
  return m?.role ?? null;
}
