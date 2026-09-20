import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { PublicUser, RecipeBook, RecipeSummary } from '@mixer/contracts';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRecipeCategoryTag } from '@/features/categories/hooks/useCategories';
import { feedApi } from '@/features/home/api/feedApi';
import { useRecentlyViewed } from '@/features/home/hooks/useRecentlyViewed';
import { recipeToCard } from '@/shared/lib/recipeToCard';
import type { BookCardData } from '@/shared/ui/BookCard';
import type { RecipeCardData } from '@/shared/ui/RecipeCard';

const MAX_COVER_IMAGES = 4;
const MAX_MEMBER_PREVIEWS = 3;

export interface HomeFeed {
  isLoading: boolean;
  recentlyViewed: Array<RecipeCardData & { isFavorite: boolean }>;
  booksWithFriends: Array<BookCardData & { isFavorite: boolean }>;
  sharedBooksWithMe: Array<BookCardData & { isFavorite: boolean }>;
  sharedWithMe: Array<RecipeCardData & { isFavorite: boolean }>;
  favorites: Array<RecipeCardData & { isFavorite: boolean }>;
}

/**
 * The home screen's data, in one request.
 *
 * This used to fan out to five endpoints, and two of them could not even be sent
 * until the books call came back — the recipe and member ids they needed were in
 * its response. `GET /feed/home` gathers those ids next to the data instead, so
 * what was a chain of round-trips is now a single one.
 */
export function useHomeFeed(): HomeFeed {
  const { user } = useAuth();
  const myId = user?.id;
  const tagOf = useRecipeCategoryTag();

  // Recently viewed comes from the local MMKV ring, hydrated via a batch fetch.
  const recentlyViewedQ = useRecentlyViewed();

  const feedQ = useQuery({
    queryKey: ['feed', 'home'],
    queryFn: () => feedApi.homeFeed(),
    enabled: !!myId,
  });

  const books = feedQ.data?.books ?? [];

  const recipeById = useMemo(() => {
    const map = new Map<string, RecipeSummary>();
    for (const r of feedQ.data?.coverRecipes ?? []) map.set(r.id, r);
    return map;
  }, [feedQ.data]);

  const userById = useMemo(() => {
    const map = new Map<string, PublicUser>();
    for (const u of feedQ.data?.members ?? []) map.set(u.id, u);
    return map;
  }, [feedQ.data]);

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

  // Already deduped and narrowed to other people's recipes by the server.
  const sharedWithMe = useMemo(
    () => (feedQ.data?.sharedWithMe ?? []).map((r) => recipeToCard(r, tagOf(r))),
    [feedQ.data, tagOf],
  );

  const favorites = useMemo(
    () => (feedQ.data?.favorites ?? []).map((r) => recipeToCard(r, tagOf(r))),
    [feedQ.data, tagOf],
  );

  return {
    isLoading: recentlyViewedQ.isLoading || feedQ.isLoading,
    recentlyViewed: recentlyViewedQ.items,
    booksWithFriends,
    sharedBooksWithMe,
    sharedWithMe,
    favorites,
  };
}
