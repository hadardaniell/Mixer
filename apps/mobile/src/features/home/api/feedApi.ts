import type { PublicUser, Recipe, RecipeBook } from '@mixer/contracts';

import { http } from '@/shared/lib/httpClient';

interface ListResponse<T> {
  items: T[];
  total?: number;
}

export const feedApi = {
  myRecipes: (limit = 10) =>
    http<ListResponse<Recipe>>(`/recipes?owner=me&limit=${limit}`),

  myBooks: () => http<ListResponse<RecipeBook>>('/recipe-books'),

  favoriteRecipes: () => http<ListResponse<Recipe>>('/favorites?kind=recipe'),

  favoriteBooks: () => http<ListResponse<RecipeBook>>('/favorites?kind=book'),

  recipeById: (id: string) => http<Recipe>(`/recipes/${id}`),

  usersByIds: (ids: string[]) =>
    http<ListResponse<PublicUser>>('/users/by-ids', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};
