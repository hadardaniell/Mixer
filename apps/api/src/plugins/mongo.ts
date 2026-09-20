//apps/api/src/plugins/mongo.ts
import type { FastifyInstance } from 'fastify';
import { MongoClient, type Db, type Collection } from 'mongodb';
import { config } from '../config.js';
import { collectionValidators } from '../db/validators/index.js';
import type {
  UserDoc,
  RefreshTokenDoc,
  RecipeDoc,
  RecipeBookDoc,
  FavoriteDoc,
  CategoryDoc,
  SharedItemDoc,
  FriendshipDoc,
  NotificationDoc,
  UrlExtractionCacheDoc,
  RecipeTranslationDoc,
  PushTokenDoc,
  CoverImageDoc,
} from '../db/types.js';

export type Collections = {
  users: Collection<UserDoc>;
  refreshTokens: Collection<RefreshTokenDoc>;
  recipes: Collection<RecipeDoc>;
  recipeBooks: Collection<RecipeBookDoc>;
  favorites: Collection<FavoriteDoc>;
  categories: Collection<CategoryDoc>;
  sharedItems: Collection<SharedItemDoc>;
  friendships: Collection<FriendshipDoc>;
  notifications: Collection<NotificationDoc>;
  urlExtractionCache: Collection<UrlExtractionCacheDoc>;
  recipeTranslations: Collection<RecipeTranslationDoc>;
  pushTokens: Collection<PushTokenDoc>;
  coverImages: Collection<CoverImageDoc>;
};

declare module 'fastify' {
  interface FastifyInstance {
    mongo: MongoClient;
    db: Db;
    collections: Collections;
  }
}

export async function mongoPlugin(app: FastifyInstance): Promise<void> {
  if (!config.mongoUrl) throw new Error('MONGO_URL is not set');
  // ignoreUndefined: the driver defaults this to false, which serializes
  // `undefined` fields as BSON null. Optional fields left undefined when
  // building docs (e.g. coverImageUrl, source.url/platform) would then be
  // written as null and rejected by the collections' $jsonSchema validators
  // (which expect string/enum/objectId when present). Omit them instead.
  const client = new MongoClient(config.mongoUrl, { ignoreUndefined: true });
  await client.connect();
  const db = client.db(config.mongoDbName);

  const collections: Collections = {
    users: db.collection<UserDoc>('users'),
    refreshTokens: db.collection<RefreshTokenDoc>('refresh_tokens'),
    recipes: db.collection<RecipeDoc>('recipes'),
    recipeBooks: db.collection<RecipeBookDoc>('recipe_books'),
    favorites: db.collection<FavoriteDoc>('favorites'),
    categories: db.collection<CategoryDoc>('categories'),
    sharedItems: db.collection<SharedItemDoc>('shared_items'),
    friendships: db.collection<FriendshipDoc>('friendships'),
    notifications: db.collection<NotificationDoc>('notifications'),
    urlExtractionCache: db.collection<UrlExtractionCacheDoc>('url_extraction_cache'),
    recipeTranslations: db.collection<RecipeTranslationDoc>('recipe_translations'),
    pushTokens: db.collection<PushTokenDoc>('push_tokens'),
    coverImages: db.collection<CoverImageDoc>('cover_images'),
  };

  await ensureValidators(app, db);
  await ensureIndexes(collections);

  app.decorate('mongo', client);
  app.decorate('db', db);
  app.decorate('collections', collections);

  app.addHook('onClose', async () => {
    await client.close();
  });
}

/**
 * Reconcile each collection's `$jsonSchema` validator to the definitions in
 * db/validators.ts. Idempotent: `collMod` is a no-op when the validator already
 * matches, and a fresh database (collection missing, NamespaceNotFound / code
 * 26) gets the collection created with the validator instead.
 */
async function ensureValidators(app: FastifyInstance, db: Db): Promise<void> {
  for (const [name, { validator, validationLevel, validationAction }] of Object.entries(
    collectionValidators,
  )) {
    try {
      await db.command({ collMod: name, validator, validationLevel, validationAction });
    } catch (e: any) {
      if (e.code === 26 || e.codeName === 'NamespaceNotFound') {
        await db.createCollection(name, { validator, validationLevel, validationAction });
      } else {
        throw e;
      }
    }
    app.log.debug({ collection: name }, 'validator reconciled');
  }
}

/**
 * Creates an index that exists purely to make a query fast, and treats a
 * conflict with an already-present index as success.
 *
 * These indexes enforce nothing the application relies on, so an existing one on
 * the same keys — even with different options or a hand-picked name — does the
 * job. Without this the server refuses to boot over it: `createIndex` throws
 * IndexOptionsConflict / IndexKeySpecsConflict, `ensureIndexes` is awaited during
 * plugin setup, and every route, sign-in included, is then unreachable. A slower
 * query is a far better failure than no API at all.
 *
 * Indexes that back a real invariant (unique emails, one doc per slug) are
 * created directly, so a conflict there still surfaces.
 */
async function ensurePerformanceIndex(
  collection: { createIndex: Collection['createIndex'] },
  keys: Parameters<Collection['createIndex']>[0],
  options: Parameters<Collection['createIndex']>[1] = {},
): Promise<void> {
  try {
    await collection.createIndex(keys, options);
  } catch (e: any) {
    // 85 IndexOptionsConflict, 86 IndexKeySpecsConflict — same keys already
    // indexed under different options or another name.
    if (e?.code !== 85 && e?.code !== 86) throw e;
    console.warn(
      `[mongo] keeping existing index for ${JSON.stringify(keys)} (${e.codeName ?? e.code})`,
    );
  }
}

async function ensureIndexes(collections: Collections): Promise<void> {
  const desiredEmail = {
    key: { email: 1 } as const,
    options: { unique: true, collation: { locale: 'en', strength: 2 } } as const,
  };

  let existing: Awaited<ReturnType<typeof collections.users.indexes>> = [];
  try {
    existing = await collections.users.indexes();
  } catch (e: any) {
    if (e.code !== 26) throw e;
  }
  const emailIdx = existing.find((i) => i.name === 'email_1');
  const hasCaseInsensitive =
    emailIdx?.collation?.locale === 'en' && emailIdx?.collation?.strength === 2;
  if (emailIdx && !hasCaseInsensitive) {
    await collections.users.dropIndex('email_1');
  }
  await collections.users.createIndex(desiredEmail.key, desiredEmail.options);

  await collections.users.createIndex(
    { 'providers.google.sub': 1 },
    { unique: true, sparse: true },
  );

  try {
    await collections.users.createIndex(
      { displayName: 1 },
      { unique: true, collation: { locale: 'en', strength: 2 } },
    );
  } catch (e: any) {
    if (e?.code === 11000) {
      console.warn('[mongo] displayName unique index skipped: existing duplicate display names in DB. New registrations are still protected by the pre-check in auth.routes.ts.');
    } else {
      throw e;
    }
  }

  // Category slugs are stable identifiers — one doc per slug.
  await collections.categories.createIndex({ slug: 1 }, { unique: true });
  // Filtering recipes by category (GET /recipes?categoryId=).
  await collections.recipes.createIndex({ categoryIds: 1 });
  // `GET /recipes?owner=me` — the profile and drafts lists. Ordered to match the
  // query's own shape (equality on ownerId/status, then the createdAt sort), so
  // the sort is served by the index rather than by an in-memory pass.
  await ensurePerformanceIndex(collections.recipes, { ownerId: 1, status: 1, createdAt: -1 });

  // The home feed opens on "my books", and every other row waits on it. The two
  // keys mirror the arms of that route's `$or` (owner, or member) — Mongo can
  // only use an index per arm, so a single compound one would be ignored.
  await ensurePerformanceIndex(collections.recipeBooks, { ownerId: 1, createdAt: -1 });
  await ensurePerformanceIndex(collections.recipeBooks, { 'members.userId': 1, createdAt: -1 });

  // `favoritedIds()` annotates every listing in the app with isFavorite, so this
  // runs on nearly every read. With the projection it uses, the index covers the
  // query outright — no document fetch at all. Unique because it is also the key
  // `addFavorite` upserts on: one row per user + kind + target.
  await ensurePerformanceIndex(
    collections.favorites,
    { userId: 1, kind: 1, targetId: 1 },
    { unique: true },
  );
  // `GET /favorites?kind=` — same prefix, but sorted rather than filtered by target.
  await ensurePerformanceIndex(collections.favorites, { userId: 1, kind: 1, createdAt: -1 });
  // Free-text recipe search (GET /recipes?q=). A collection allows only one text
  // index, so if one already exists (possibly created by hand with different
  // weights/name) we keep it — its mere existence is what $text needs. A fresh
  // DB gets this weighted one instead.
  try {
    await collections.recipes.createIndex(
      { title: 'text', description: 'text', tags: 'text' },
      {
        name: 'recipe_text',
        weights: { title: 10, tags: 4, description: 1 },
        // RecipeDoc has a `language` field ('he'|'en'). MongoDB would normally read
        // that field to pick a stemmer, but 'he' is not a supported text-search
        // language (code 17262). Point language_override at a non-existent field and
        // disable stemming entirely so the index works for both Hebrew and English.
        default_language: 'none',
        language_override: 'searchLanguage',
      },
    );
  } catch (e: any) {
    // 85 IndexOptionsConflict / 86 IndexKeySpecsConflict: an equivalent text
    // index already exists under another name — fine, leave it in place.
    if (e?.code !== 85 && e?.code !== 86) throw e;
  }
  await collections.sharedItems.createIndex({ resourceId: 1, friendId: 1 });
  await collections.sharedItems.createIndex({ friendId: 1, status: 1 });
  await collections.sharedItems.createIndex({ ownerId: 1, status: 1 });

  // Friendship docs use `addresseeId` (not `recipientId`). The unique pair index
  // dedupes same-direction requests; the reverse direction is guarded in the
  // service before insert. `addresseeId + status` backs the incoming-requests query.
  // Drop stale index from before the recipientId → addresseeId rename. Without
  // this, new docs (which have no recipientId) all land on the same null key and
  // only the first insert per requester succeeds.
  try {
    await collections.friendships.dropIndex('requesterId_1_recipientId_1');
  } catch (e: any) {
    if (e?.code !== 27) throw e; // 27 = IndexNotFound — already gone, fine
  }
  await collections.friendships.createIndex({ requesterId: 1, addresseeId: 1 }, { unique: true });
  await collections.friendships.createIndex({ addresseeId: 1, status: 1 });

  // Keyed by url AND locale, because that is how the cache is read
  // (`findOne({ url, locale })`). A unique index on `url` alone silently allowed
  // only the first language to ever be cached: the second locale missed the
  // lookup, re-extracted, then lost its insert to a swallowed E11000. Same
  // shape as `recipeTranslations` above, for the same reason.
  try {
    await collections.urlExtractionCache.dropIndex('url_1');
  } catch (e: any) {
    if (e?.code !== 27) throw e; // 27 = IndexNotFound — already gone, fine
  }
  await collections.urlExtractionCache.createIndex({ url: 1, locale: 1 }, { unique: true });

  await collections.notifications.createIndex({ userId: 1, read: 1, createdAt: -1 });
  await collections.notifications.createIndex({ userId: 1, type: 1 });
  await collections.notifications.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, sparse: true },
  );
  await collections.recipeTranslations.createIndex({ recipeId: 1, language: 1 }, { unique: true });

  // Same device upserts its token; never creates a duplicate row per user+device.
  await collections.pushTokens.createIndex({ userId: 1, deviceId: 1 }, { unique: true });
  // Fast lookup when Expo reports an invalid token and we need to delete it.
  await collections.pushTokens.createIndex({ token: 1 });

  // One image per dish — the whole point of the cover library is that the same
  // dish never gets generated twice.
  await collections.coverImages.createIndex({ dishKey: 1 }, { unique: true });
}
