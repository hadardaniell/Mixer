import { describe, expect, it } from 'vitest';
import { ObjectId } from 'mongodb';

import { visibleRecipeFilter } from '../recipes.utils.js';

const me = new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa');

/**
 * Stands in for a collection, returning a fixed set of docs and recording the
 * filter it was asked for — the filters matter as much as the result here, since
 * "shares that were never accepted" is a correctness question, not a shape one.
 */
function fakeCollection(docs: unknown[]) {
  const calls: unknown[] = [];
  return {
    calls,
    find(filter: unknown) {
      calls.push(filter);
      return { project: () => ({ toArray: async () => docs }) };
    },
  };
}

function makeCollections(opts: {
  books?: unknown[];
  shares?: unknown[];
  favorites?: unknown[];
}) {
  return {
    recipeBooks: fakeCollection(opts.books ?? []),
    sharedItems: fakeCollection(opts.shares ?? []),
    favorites: fakeCollection(opts.favorites ?? []),
  };
}

// The helper takes real driver Collections; the fakes above satisfy only the two
// methods it uses, so the call sites need a cast.
const run = (collections: ReturnType<typeof makeCollections>) =>
  visibleRecipeFilter(collections as never, me);

describe('visibleRecipeFilter', () => {
  it('falls back to just my own recipes when I reach nothing else', async () => {
    expect(await run(makeCollections({}))).toEqual({ $or: [{ ownerId: me }] });
  });

  it('never matches on visibility — a stranger\'s public recipe is not browsable', async () => {
    const filter = await run(makeCollections({}));
    expect(JSON.stringify(filter)).not.toContain('visibility');
  });

  it('includes recipes reached through my books', async () => {
    const a = new ObjectId();
    const b = new ObjectId();
    const filter = await run(makeCollections({ books: [{ recipeIds: [a, b] }] }));
    expect(filter).toEqual({ $or: [{ ownerId: me }, { _id: { $in: [a, b] } }] });
  });

  it('includes direct shares and favourites alongside books', async () => {
    const fromBook = new ObjectId();
    const shared = new ObjectId();
    const favourited = new ObjectId();
    const filter = await run(
      makeCollections({
        books: [{ recipeIds: [fromBook] }],
        shares: [{ resourceId: shared }],
        favorites: [{ targetId: favourited }],
      }),
    );
    expect(filter).toEqual({
      $or: [{ ownerId: me }, { _id: { $in: [fromBook, shared, favourited] } }],
    });
  });

  it('tolerates a book with no recipes yet', async () => {
    const only = new ObjectId();
    const filter = await run(
      makeCollections({ books: [{}, { recipeIds: [only] }] }),
    );
    expect(filter).toEqual({ $or: [{ ownerId: me }, { _id: { $in: [only] } }] });
  });

  it('asks only for accepted recipe shares — a pending share is an invitation, not access', async () => {
    const collections = makeCollections({});
    await run(collections);
    expect(collections.sharedItems.calls[0]).toEqual({
      friendId: me,
      resourceType: 'recipe',
      status: 'accepted',
    });
  });

  it('asks for books I own or am a member of', async () => {
    const collections = makeCollections({});
    await run(collections);
    expect(collections.recipeBooks.calls[0]).toEqual({
      $or: [{ ownerId: me }, { 'members.userId': me }],
    });
  });

  it('asks only for recipe favourites, not book ones', async () => {
    const collections = makeCollections({});
    await run(collections);
    expect(collections.favorites.calls[0]).toEqual({ userId: me, kind: 'recipe' });
  });
});
