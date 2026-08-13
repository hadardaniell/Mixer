//apps/mobile/src/features/home/api/feedApi.ts
import type {
  CreateRecipeBookInput,
  CreateRecipeInput,
  ExtractFromImageInput,
  ExtractFromTextResult,
  PublicUser,
  Recipe,
  RecipeBook,
  SharedItem,
} from '@mixer/contracts';

import { http } from '@/shared/lib/httpClient';
import { buildImageFormData, type UploadableFile } from '@/shared/lib/imageFormData';

interface ListResponse<T> {
  items: T[];
  total?: number;
}

/** Must stay <= the `RecipesByIdsInputSchema` cap the API validates against. */
const RECIPE_BATCH_SIZE = 200;

export const feedApi = {
  myRecipes: (limit = 10) =>
    http<ListResponse<Recipe>>(`/recipes?owner=me&limit=${limit}`),

  drafts: (limit = 10) =>
    http<ListResponse<Recipe>>(`/recipes?owner=me&status=draft&limit=${limit}`),

  myBooks: () => http<ListResponse<RecipeBook>>('/recipe-books'),

  allMyRecipes: () => http<ListResponse<Recipe>>('/recipes?owner=me&limit=100'),

  createBook: (input: CreateRecipeBookInput) =>
    http<RecipeBook>('/recipe-books', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  favoriteRecipes: () => http<ListResponse<Recipe>>('/favorites?kind=recipe'),

  favoriteBooks: () => http<ListResponse<RecipeBook>>('/favorites?kind=book'),

  recipeById: (id: string) => http<Recipe>(`/recipes/${id}`),

  /**
   * Hydrates a batch of recipe ids in one round-trip. Prefer this over mapping
   * `recipeById` over a list — that pattern is what made the home feed slow.
   * Unreadable or deleted ids come back missing rather than as errors.
   */
  recipesByIds: async (ids: string[]): Promise<Recipe[]> => {
    if (ids.length === 0) return [];
    // The endpoint caps a batch at 200 ids; a long list goes as a few parallel
    // requests rather than one per id.
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += RECIPE_BATCH_SIZE) {
      chunks.push(ids.slice(i, i + RECIPE_BATCH_SIZE));
    }
    const responses = await Promise.all(
      chunks.map((chunk) =>
        http<ListResponse<Recipe>>('/recipes/by-ids', {
          method: 'POST',
          body: JSON.stringify({ ids: chunk }),
        }),
      ),
    );
    return responses.flatMap((r) => r.items);
  },

  /** Inbox of things friends shared directly with me (as opposed to via a shared book). */
  receivedShares: (limit = 50) =>
    http<ListResponse<SharedItem>>(`/shares/received?status=accepted&limit=${limit}`),

  recipesByCategory: (categoryId: string, limit = 100) =>
    http<ListResponse<Recipe>>(`/recipes?categoryId=${categoryId}&limit=${limit}`),

  searchRecipes: (q: string, limit = 20) =>
    http<ListResponse<Recipe>>(`/recipes?q=${encodeURIComponent(q)}&limit=${limit}`),

  // Embedding-based recipe search: ranks recipes by semantic similarity to the
  // query rather than exact keyword match. Returns the top matches (no `total`).
  semanticSearchRecipes: (q: string) =>
    http<ListResponse<Recipe>>(`/recipes/semantic-search?q=${encodeURIComponent(q)}`),

  searchBooks: (q: string) =>
    http<ListResponse<RecipeBook>>(`/recipe-books?q=${encodeURIComponent(q)}`),

  usersByIds: (ids: string[]) =>
    http<ListResponse<PublicUser>>('/users/by-ids', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  // --- recipe creation / AI import ---
  importText: (text: string, locale?: string) =>
    http<ExtractFromTextResult>('/recipes/import/text', {
      method: 'POST',
      body: JSON.stringify({ text, locale }),
    }),

  importImage: (images: ExtractFromImageInput['images'], locale?: string) =>
    http<ExtractFromTextResult>('/recipes/import/image', {
      method: 'POST',
      body: JSON.stringify({ images, locale }),
    }),

  importUrl: (url: string, locale?: string) =>
    http<ExtractFromTextResult>('/recipes/import/url', {
      method: 'POST',
      body: JSON.stringify({ url, locale }),
    }),

  // Uploads a cover image to Firebase Storage and returns its public URL.
  // Sent as multipart/form-data; the server reads the first file part.
  uploadRecipeImage: async (file: UploadableFile) => {
    const form = await buildImageFormData(file);
    return http<{ imageUrl: string }>('/recipes/upload-image', {
      method: 'POST',
      body: form,
    });
  },

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

  deleteRecipe: (id: string) =>
    http<void>(`/recipes/${id}`, { method: 'DELETE' }),

  // "Save as" — server-side duplicate of a recipe you can read into a private
  // copy you own (added to your personal book). Used for recipes that aren't
  // yours, where sharing isn't available.
  saveAsRecipe: (id: string) =>
    http<Recipe>(`/recipes/${id}/save-as`, { method: 'POST' }),

  addRecipeToBook: (bookId: string, recipeId: string) =>
    http<RecipeBook>(`/recipe-books/${bookId}/recipes/${recipeId}`, { method: 'POST' }),

  translateRecipe: (id: string) =>
    http<Recipe>(`/recipes/${id}/translate`, { method: 'POST',}),
};
