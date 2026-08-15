import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { PublicUser, Recipe, RecipeBook } from '@mixer/contracts';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRecipeCategoryTag } from '@/features/categories/hooks/useCategories';
import { feedApi } from '@/features/home/api/feedApi';
import { useRecentlyViewed } from '@/features/home/hooks/useRecentlyViewed';
import { recipeToCard } from '@/shared/lib/recipeToCard';
import type { BookCardData } from '@/shared/ui/BookCard';
import type { RecipeCardData } from '@/shared/ui/RecipeCard';

const MAX_COVER_IMAGES = 4;
const MAX_MEMBER_PREVIEWS = 3;
/**
 * The "shared with me" row is a preview, not an archive — it shows a handful of
 * cards behind a "see more". Hydrating every recipe of every shared book (which
 * can run to hundreds) to render ten of them was the single biggest cost on the
 * feed, so only the newest slice of each book's ids is fetched here. The full
 * list still lives behind the row's own screen.
 */
const MAX_SHARED_PER_BOOK = 12;

export interface HomeFeed {
  isLoading: boolean;
  recentlyViewed: Array<RecipeCardData & { isFavorite: boolean }>;
  booksWithFriends: Array<BookCardData & { isFavorite: boolean }>;
  sharedBooksWithMe: Array<BookCardData & { isFavorite: boolean }>;
  sharedWithMe: Array<RecipeCardData & { isFavorite: boolean }>;
  favorites: Array<RecipeCardData & { isFavorite: boolean }>;
}

export function useHomeFeed(): HomeFeed {
  const { user } = useAuth();
  const myId = user?.id;
  const tagOf = useRecipeCategoryTag();
  const toRecipeCard = (r: Recipe) => recipeToCard(r, tagOf(r));

  // Recently viewed comes from the local MMKV ring, hydrated via per-id fetch.
  const recentlyViewedQ = useRecentlyViewed();

  const booksQ = useQuery({
    queryKey: ['feed', 'my-books'],
    queryFn: () => feedApi.myBooks(),
    enabled: !!myId,
  });

  const favRecipesQ = useQuery({
    queryKey: ['feed', 'favorite-recipes'],
    queryFn: () => feedApi.favoriteRecipes(),
    enabled: !!myId,
  });

  const books = booksQ.data?.items ?? [];

  // Collect first 4 recipe ids per book for cover grid
  const coverRecipeIds = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) {
      for (const id of b.recipeIds.slice(0, MAX_COVER_IMAGES)) set.add(id);
    }
    return Array.from(set);
  }, [books]);

  // Recipes that live in books shared with me (owner != me) — the "shared with
  // me" feed.
  const sharedRecipeIds = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) {
      const isMyBook = b.ownerId === myId;
      const hasOtherMembers = b.members.some((m: { userId: string }) => m.userId !== myId);
      // Include recipes from books I don't own, AND from my own books that have
      // other members (friends may have added recipes there too).
      if (!isMyBook || hasOtherMembers) {
        for (const id of b.recipeIds.slice(0, MAX_SHARED_PER_BOOK)) set.add(id);
      }
    }
    return Array.from(set);
  }, [books, myId]);

  // Covers and the shared row both want recipes reachable through my books, so they
  // ride on one batch rather than two overlapping ones — a book's cover recipes are
  // usually a subset of its shared ones anyway.
  const bookRecipeIds = useMemo(
    () => Array.from(new Set([...coverRecipeIds, ...sharedRecipeIds])),
    [coverRecipeIds, sharedRecipeIds],
  );

  const bookRecipesQ = useQuery({
    queryKey: ['feed', 'book-recipes', [...bookRecipeIds].sort().join(',')],
    queryFn: () => feedApi.recipesByIds(bookRecipeIds),
    enabled: bookRecipeIds.length > 0,
  });

  // Recipes a friend shared with me directly. Distinct from the ids above, which only
  // cover recipes reachable through a shared book — a direct share belongs to no book
  // of mine, so it would otherwise never appear on the feed.
  const receivedSharesQ = useQuery({
    queryKey: ['feed', 'received-shares'],
    queryFn: () => feedApi.receivedShares(),
    enabled: !!myId,
  });

  const directSharedIds = useMemo(
    () =>
      (receivedSharesQ.data?.items ?? [])
        .filter((s) => s.resourceType === 'recipe')
        .map((s) => s.resourceId),
    [receivedSharesQ.data],
  );

  const directSharedRecipesQ = useQuery({
    queryKey: ['feed', 'direct-shared-recipes', [...directSharedIds].sort().join(',')],
    // A share whose recipe was since deleted simply comes back missing from the
    // batch, so it can't empty the whole row.
    queryFn: () => feedApi.recipesByIds(directSharedIds),
    enabled: directSharedIds.length > 0,
  });

  // Collect member user ids across all books
  const memberUserIds = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) {
      for (const m of b.members) set.add(m.userId);
    }
    return Array.from(set);
  }, [books]);

  const usersQ = useQuery({
    queryKey: ['feed', 'book-members', memberUserIds.sort().join(',')],
    queryFn: () => feedApi.usersByIds(memberUserIds),
    enabled: memberUserIds.length > 0,
  });

  const recipeById = useMemo(() => {
    const map = new Map<string, Recipe>();
    for (const r of bookRecipesQ.data ?? []) map.set(r.id, r);
    return map;
  }, [bookRecipesQ.data]);

  const userById = useMemo(() => {
    const map = new Map<string, PublicUser>();
    for (const u of usersQ.data?.items ?? []) map.set(u.id, u);
    return map;
  }, [usersQ.data]);

  const buildBookCard = (b: RecipeBook): BookCardData & { isFavorite: boolean } => {
    const coverImages = b.recipeIds
      .slice(0, MAX_COVER_IMAGES)
      .map((id) => recipeById.get(id)?.coverImageUrl)
      .filter((url): url is string => !!url);

    const members = b.members
      .filter((m) => m.userId !== myId) // exclude self from preview
      .slice(0, MAX_MEMBER_PREVIEWS + 1)
      .map((m) => {
        const u = userById.get(m.userId);
        return {
          id: m.userId,
          displayName: u?.displayName ?? '?',
          avatarUrl: u?.avatarUrl,
        };
      });

    return {
      id: b.id,
      name: b.name,
      recipeCount: b.recipeIds.length,
      coverKey: b.coverKey,
      coverImageUrl: b.coverImageUrl,
      coverImages,
      members,
      isFavorite: b.isFavorite ?? false,
    };
  };

  // Books I own that have at least one other collaborator.
  const booksWithFriends = useMemo(
    () => books.filter((b) => b.ownerId === myId && b.members.length > 1).map(buildBookCard),
    [books, recipeById, userById, myId],
  );

  // Books owned by someone else where I am an active member.
  const sharedBooksWithMe = useMemo(
    () => books.filter((b) => b.ownerId !== myId).map(buildBookCard),
    [books, recipeById, userById, myId],
  );

  // Both routes to "someone shared this with me" — a book I'm a member of, and a direct
  // share — collapsed into one row. Deduped by id: the same recipe can arrive both ways.
  const sharedWithMe = useMemo(() => {
    // `bookRecipesQ` also carries cover recipes from books nobody else is in, so the
    // book half is narrowed back down to the ids the shared row actually asked for.
    const wanted = new Set(sharedRecipeIds);
    const fromBooks = (bookRecipesQ.data ?? []).filter((r) => wanted.has(r.id));
    const byId = new Map<string, Recipe>();
    for (const r of [...fromBooks, ...(directSharedRecipesQ.data ?? [])]) {
      if (r.ownerId !== myId) byId.set(r.id, r); // only what others shared, not my own
    }
    return Array.from(byId.values()).map(toRecipeCard);
  }, [bookRecipesQ.data, sharedRecipeIds, directSharedRecipesQ.data, myId, tagOf]);

  const favorites = useMemo(
    () => (favRecipesQ.data?.items ?? []).map(toRecipeCard),
    [favRecipesQ.data, tagOf],
  );

  return {
    isLoading:
      recentlyViewedQ.isLoading ||
      booksQ.isLoading ||
      favRecipesQ.isLoading ||
      bookRecipesQ.isLoading ||
      usersQ.isLoading ||
      receivedSharesQ.isLoading ||
      directSharedRecipesQ.isLoading,
    recentlyViewed: recentlyViewedQ.items,
    booksWithFriends,
    sharedBooksWithMe,
    sharedWithMe,
    favorites,
  };
}
