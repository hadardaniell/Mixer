import type {
  AddBookMemberInput,
  RecipeBook,
  UpdateRecipeBookInput,
} from '@mixer/contracts';

import { http } from '@/shared/lib/httpClient';

/**
 * Everything the book detail screen calls. Creation stays in `feedApi` (it
 * belongs to the create wizard); this module owns the single-book operations.
 *
 * Server-side permissions are already enforced per route — read: any member,
 * edit + recipes: owner/editor, members + delete: owner. The screen mirrors
 * those rules by hiding affordances, but the API is the real gate.
 */
export const bookApi = {
  getById: (id: string) => http<RecipeBook>(`/recipe-books/${id}`),

  update: (id: string, input: UpdateRecipeBookInput) =>
    http<RecipeBook>(`/recipe-books/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (id: string) => http<void>(`/recipe-books/${id}`, { method: 'DELETE' }),

  addRecipe: (id: string, recipeId: string) =>
    http<RecipeBook>(`/recipe-books/${id}/recipes/${recipeId}`, { method: 'POST' }),

  removeRecipe: (id: string, recipeId: string) =>
    http<RecipeBook>(`/recipe-books/${id}/recipes/${recipeId}`, { method: 'DELETE' }),

  addMember: (id: string, input: AddBookMemberInput) =>
    http<RecipeBook>(`/recipe-books/${id}/members`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateMemberRole: (id: string, userId: string, role: 'editor' | 'viewer') =>
    http<RecipeBook>(`/recipe-books/${id}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  // Also serves "leave book": the server accepts this when userId is the
  // caller's own id, not just when they own the book.
  removeMember: (id: string, userId: string) =>
    http<RecipeBook>(`/recipe-books/${id}/members/${userId}`, { method: 'DELETE' }),
};
