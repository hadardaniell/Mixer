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
} from '../db/types.js';

export type Collections = {
  users: Collection<UserDoc>;
  refreshTokens: Collection<RefreshTokenDoc>;
  recipes: Collection<RecipeDoc>;
  recipeBooks: Collection<RecipeBookDoc>;
  favorites: Collection<FavoriteDoc>;
  categories: Collection<CategoryDoc>;
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

  // Category slugs are stable identifiers — one doc per slug.
  await collections.categories.createIndex({ slug: 1 }, { unique: true });
  // Filtering recipes by category (GET /recipes?categoryId=).
  await collections.recipes.createIndex({ categoryIds: 1 });
  // Free-text recipe search (GET /recipes?q=). A collection allows only one text
  // index, so if one already exists (possibly created by hand with different
  // weights/name) we keep it — its mere existence is what $text needs. A fresh
  // DB gets this weighted one instead.
  try {
    await collections.recipes.createIndex(
      { title: 'text', description: 'text', tags: 'text' },
      { name: 'recipe_text', weights: { title: 10, tags: 4, description: 1 } },
    );
  } catch (e: any) {
    // 85 IndexOptionsConflict / 86 IndexKeySpecsConflict: an equivalent text
    // index already exists under another name — fine, leave it in place.
    if (e?.code !== 85 && e?.code !== 86) throw e;
  }
}
