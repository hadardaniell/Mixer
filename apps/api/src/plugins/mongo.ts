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

  app.decorate('mongo', client);
  app.decorate('db', db);
  app.decorate('collections', collections);

  app.addHook('onClose', async () => {
    await client.close();
  });
}
