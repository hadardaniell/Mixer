import type { CollectionValidator } from './types.js';
import { usersValidator } from './users.js';
import { refreshTokensValidator } from './refresh-tokens.js';
import { recipesValidator } from './recipes.js';
import { recipeBooksValidator } from './recipe-books.js';
import { favoritesValidator } from './favorites.js';
import { sharedItemsValidator } from './shared-items.js';
import { notificationsValidator } from './notifications.js';

/**
 * Source of truth for the MongoDB collection `$jsonSchema` validators.
 *
 * These used to live only in Atlas, hand-edited in the shell, and drifted out
 * of sync with the document shapes in `db/types.ts` (a missing field or a wrong
 * bsonType surfaces only at runtime as `Document failed validation`, code 121).
 * They are now reconciled on API startup by `ensureValidators` in the mongo
 * plugin, so the schema travels with the code and is covered by review.
 *
 * Each schema lives in its own file; keep it in sync with the matching `*Doc`
 * type in `db/types.ts`. The validators are a defense-in-depth backstop against
 * every writer (this API, migrations, a future worker, a manual mongosh fix) —
 * not a replacement for the Zod input validation at the HTTP boundary.
 *
 * Keys are the real collection names (snake_case), matching the names passed to
 * `db.collection(...)` in the mongo plugin.
 */
export const collectionValidators: Record<string, CollectionValidator> = {
  users: usersValidator,
  refresh_tokens: refreshTokensValidator,
  recipes: recipesValidator,
  recipe_books: recipeBooksValidator,
  favorites: favoritesValidator,
  shared_items: sharedItemsValidator,
  notifications: notificationsValidator,
};

export type { CollectionValidator } from './types.js';
