# @mixer/api

Fastify backend for Mixer. One sentence per function so future-you can scan and find things.

Interactive docs at `http://localhost:3000/docs` once the server is running.

## Running

```
pnpm --filter @mixer/api dev      # tsx watch with .env loaded
pnpm --filter @mixer/api build    # tsc to dist/
pnpm --filter @mixer/api start    # node dist/server.js
pnpm --filter @mixer/api typecheck
```

Env vars live in `apps/api/.env` (template in `.env.example`).

---

## Routes (HTTP surface)

### Auth — [src/modules/auth/auth.routes.ts](src/modules/auth/auth.routes.ts)

| Method | Path | Auth | What it does |
|---|---|---|---|
| `POST` | `/auth/register` | public | Creates a new user with email+password, returns access + refresh tokens. |
| `POST` | `/auth/login` | public | Verifies email+password, returns access + refresh tokens. |
| `POST` | `/auth/google` | public | Verifies a Google ID token from the mobile app, finds or creates the matching user, returns tokens. |
| `POST` | `/auth/refresh` | public | Rotates a refresh token: revokes the old one, issues a new access+refresh pair. |
| `POST` | `/auth/logout` | public | Marks the supplied refresh token revoked. |
| `GET` | `/auth/me` | user | Returns the current authenticated user's public profile. |

### Users — [src/modules/users/users.routes.ts](src/modules/users/users.routes.ts)

| Method | Path | Auth | What it does |
|---|---|---|---|
| `GET` | `/users/me` | user | Returns my profile. |
| `PATCH` | `/users/me` | user | Updates my own displayName / avatarUrl / locale. |
| `POST` | `/users` | admin | Creates a user with optional password (admin-only; for invites or seeded accounts). |
| `GET` | `/users` | admin | Lists users with `limit`/`skip` pagination and total count. |
| `GET` | `/users/:id` | admin | Returns a single user by id. |
| `PATCH` | `/users/:id` | admin | Updates a user's profile or role. |
| `DELETE` | `/users/:id` | admin | Deletes a user. |

### Recipes — [src/modules/recipes/recipes.routes.ts](src/modules/recipes/recipes.routes.ts)

| Method | Path | Auth | What it does |
|---|---|---|---|
| `POST` | `/recipes` | user | Creates a recipe owned by the caller. |
| `GET` | `/recipes` | optional | Lists recipes with filters (`owner`, `tag`, `q` text search, `visibility`) and pagination; visibility-aware; annotates `isFavorite` when authenticated. |
| `GET` | `/recipes/:id` | optional | Returns one recipe (respects visibility); annotates `isFavorite` when authenticated. |
| `PATCH` | `/recipes/:id` | owner | Updates a recipe; only the owner may call. |
| `DELETE` | `/recipes/:id` | owner | Deletes a recipe; only the owner may call. |
| `POST` | `/recipes/:id/fork` | user | Clones a recipe into the caller's library with `forkedFrom`/`forkedAt` set; private by default. |

### Recipe books — [src/modules/recipe-books/recipe-books.routes.ts](src/modules/recipe-books/recipe-books.routes.ts)

| Method | Path | Auth | What it does |
|---|---|---|---|
| `POST` | `/recipe-books` | user | Creates a book; caller becomes the owner-member. |
| `GET` | `/recipe-books` | user | Lists books the caller owns or is a member of; annotates `isFavorite`. |
| `GET` | `/recipe-books/:id` | member | Returns one book if caller is owner/editor/viewer; annotates `isFavorite`. |
| `PATCH` | `/recipe-books/:id` | owner+editor | Updates book metadata (name, description, etc.). |
| `DELETE` | `/recipe-books/:id` | owner | Deletes the book. |
| `POST` | `/recipe-books/:id/recipes/:recipeId` | owner+editor | Adds a recipe to the book (idempotent). |
| `DELETE` | `/recipe-books/:id/recipes/:recipeId` | owner+editor | Removes a recipe from the book. |
| `POST` | `/recipe-books/:id/members` | owner | Invites a user to the book as editor or viewer. |
| `PATCH` | `/recipe-books/:id/members/:userId` | owner | Changes an existing member's role. |
| `DELETE` | `/recipe-books/:id/members/:userId` | owner | Removes a member from the book. |

### Favorites — [src/modules/favorites/favorites.routes.ts](src/modules/favorites/favorites.routes.ts)

| Method | Path | Auth | What it does |
|---|---|---|---|
| `POST` | `/favorites/recipes/:recipeId` | user | Marks a recipe as favorite (idempotent). |
| `DELETE` | `/favorites/recipes/:recipeId` | user | Unfavorites a recipe. |
| `POST` | `/favorites/books/:bookId` | user | Marks a recipe book as favorite. |
| `DELETE` | `/favorites/books/:bookId` | user | Unfavorites a recipe book. |
| `GET` | `/favorites/recipes` | user | Lists the caller's favorited recipes, visibility-aware. |
| `GET` | `/favorites/books` | user | Lists the caller's favorited books, membership-aware. |

### Health/hello — [src/routes/hello.ts](src/routes/hello.ts)

| Method | Path | Auth | What it does |
|---|---|---|---|
| `GET` | `/hello` | public | Returns `{ message: "hello from api" }` to prove the @mixer/contracts wiring works end-to-end. |

---

## Services & helpers

### `auth.service.ts` — [src/modules/auth/auth.service.ts](src/modules/auth/auth.service.ts)

- `hashPassword(password)` — bcrypts the password with the configured cost factor.
- `verifyPassword(password, hash)` — constant-time bcrypt compare.
- `issueTokens(collections, user, meta?)` — signs an access JWT and inserts a hashed refresh token row, returning the full `AuthResponse`.
- `rotateRefreshToken(collections, refreshToken, meta?)` — validates and revokes the incoming refresh token, then issues a fresh pair.
- `revokeRefreshToken(collections, refreshToken)` — marks a refresh token revoked (used by logout).
- `verifyGoogleIdToken(idToken)` — calls `google-auth-library` to verify the JWT against Google's JWKS and your client ID.
- `findOrCreateGoogleUser(collections, profile)` — looks up the user by Google `sub`, falls back to email-link, otherwise creates a new user with `passwordHash: null`.

### `favorites.service.ts` — [src/modules/favorites/favorites.service.ts](src/modules/favorites/favorites.service.ts)

- `favoritedIds(collections, userId, kind, targetIds)` — returns the subset of ids the user has favorited; used to annotate listings with `isFavorite` in one query.

### Mappers (DB doc → wire shape)

- `toPublicUser(doc)` — strips `passwordHash`/`providers` and converts dates/ids to strings. [src/modules/users/users.mapper.ts](src/modules/users/users.mapper.ts)
- `toRecipe(doc, { isFavorite? })` — converts a `RecipeDoc` to the API `Recipe`, optionally tagging it as favorited. [src/modules/recipes/recipes.mapper.ts](src/modules/recipes/recipes.mapper.ts)
- `toRecipeBook(doc, { isFavorite? })` — same idea for books. [src/modules/recipe-books/recipe-books.mapper.ts](src/modules/recipe-books/recipe-books.mapper.ts)

### Plugins

- `mongoPlugin(app)` — connects to MongoDB, exposes `app.mongo`, `app.db`, `app.collections`, closes the client on shutdown. [src/plugins/mongo.ts](src/plugins/mongo.ts)
- `authPlugin(app)` — decorates `app.authenticate` (verifies bearer JWT) and `app.requireAdmin` (checks role) for route guards. [src/plugins/auth.ts](src/plugins/auth.ts)
- `signAccessToken(user)` — issues a short-lived HS256 JWT carrying `{ sub, role, exp }`.
- (internal) `verifyAccessToken(token)` — verifies signature + expiry; thrown on any failure.

### Internal helpers inside routes

- `canRead(req, recipeDoc)` (recipes) — returns true if the recipe is public/unlisted or owned by the caller; gates `GET /recipes/:id` and fork.
- `memberRole(book, userId)` (recipe books) — returns `'owner' | 'editor' | 'viewer' | null` for the caller relative to a book; used by every recipe-book route's authorization check.
- `addFavorite` / `removeFavorite` (favorites) — upserts/deletes a single favorite row; shared by the recipe and book route pairs.

---

## Entry points

- [src/server.ts](src/server.ts) — boots the app and calls `listen()`.
- [src/app.ts](src/app.ts) — `buildApp()` constructs Fastify, registers Swagger, plugins, and all route modules in order.
- [src/config.ts](src/config.ts) — `config` object with all env-var defaults in one place.
