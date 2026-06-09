import type {
  CreateRecipeInput,
  ExtractFromImageInput,
  ExtractFromTextResult,
  PublicUser,
  Recipe,
  RecipeBook,
} from '@mixer/contracts';

import { http } from '@/shared/lib/httpClient';

interface ListResponse<T> {
  items: T[];
  total?: number;
}

export const feedApi = {
  myRecipes: (limit = 10) =>
    http<ListResponse<Recipe>>(`/recipes?owner=me&limit=${limit}`),

  drafts: (limit = 10) =>
    http<ListResponse<Recipe>>(`/recipes?owner=me&status=draft&limit=${limit}`),

  myBooks: () => http<ListResponse<RecipeBook>>('/recipe-books'),

  favoriteRecipes: () => http<ListResponse<Recipe>>('/favorites?kind=recipe'),

  favoriteBooks: () => http<ListResponse<RecipeBook>>('/favorites?kind=book'),

  recipeById: (id: string) => http<Recipe>(`/recipes/${id}`),

  usersByIds: (ids: string[]) =>
    http<ListResponse<PublicUser>>('/users/by-ids', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  // --- recipe creation / AI import ---
  importText: (text: string) =>
    http<ExtractFromTextResult>('/recipes/import/text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  importImage: (images: ExtractFromImageInput['images']) =>
    http<ExtractFromTextResult>('/recipes/import/image', {
      method: 'POST',
      body: JSON.stringify({ images }),
    }),

  createRecipe: (input: CreateRecipeInput) =>
    http<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateRecipe: (id: string, input: Partial<CreateRecipeInput>) =>
    http<Recipe>(`/recipes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
};
