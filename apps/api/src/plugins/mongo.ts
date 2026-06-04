// apps/api/src/plugins/mongo.ts
import type { FastifyInstance } from 'fastify';
import { MongoClient, type Db, type Collection } from 'mongodb';
import { config } from '../config.js';
import type {
  UserDoc,
  RefreshTokenDoc,
  RecipeDoc,
  RecipeBookDoc,
  FavoriteDoc,
} from '../db/types.js';


export type Collections = {
  users: Collection<UserDoc>;
  refreshTokens: Collection<RefreshTokenDoc>;
  recipes: Collection<RecipeDoc>;
  recipeBooks: Collection<RecipeBookDoc>;
  favorites: Collection<FavoriteDoc>;
};

declare module 'fastify' {
  interface FastifyInstance {
    mongo: MongoClient;
    db: Db;
    collections: Collections;
  }
}

export async function mongoPlugin(app: FastifyInstance): Promise<void> {
  const client = new MongoClient(config.mongoUrl);
  await client.connect();
  const db = client.db(config.mongoDbName);

  const collections: Collections = {
    users: db.collection<UserDoc>('users'),
    refreshTokens: db.collection<RefreshTokenDoc>('refresh_tokens'),
    recipes: db.collection<RecipeDoc>('recipes'),
    recipeBooks: db.collection<RecipeBookDoc>('recipe_books'),
    favorites: db.collection<FavoriteDoc>('favorites'),
  };

  await ensureIndexes(collections);

  app.decorate('mongo', client);
  app.decorate('db', db);
  app.decorate('collections', collections);

  app.addHook('onClose', async () => {
    await client.close();
  });
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
}
