import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { PublicUser, Recipe, RecipeBook } from '@mixer/contracts';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { feedApi } from '@/features/home/api/feedApi';
import { useRecentlyViewed } from '@/features/home/hooks/useRecentlyViewed';
import type { BookCardData } from '@/shared/ui/BookCard';
import type { RecipeCardData } from '@/shared/ui/RecipeCard';

const MAX_COVER_IMAGES = 4;
const MAX_MEMBER_PREVIEWS = 3;

export interface HomeFeed {
  isLoading: boolean;
  recentlyViewed: Array<RecipeCardData & { isFavorite: boolean }>;
  booksWithFriends: Array<BookCardData & { isFavorite: boolean }>;
  sharedWithMe: Array<BookCardData & { isFavorite: boolean }>;
  favorites: Array<RecipeCardData & { isFavorite: boolean }>;
}

function toRecipeCard(r: Recipe): RecipeCardData & { isFavorite: boolean } {
  const totalTime = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0) || undefined;
  return {
    id: r.id,
    name: r.title,
    imageUrl: r.coverImageUrl,
    durationMinutes: totalTime,
    tag: r.tags[0],
    isFavorite: r.isFavorite ?? false,
  };
}

export function useHomeFeed(): HomeFeed {
  const { user } = useAuth();
  const myId = user?.id;

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

  const coverRecipesQ = useQuery({
    queryKey: ['feed', 'cover-recipes', coverRecipeIds.sort().join(',')],
    queryFn: async () => {
      const results = await Promise.all(coverRecipeIds.map((id) => feedApi.recipeById(id)));
      return results;
    },
    enabled: coverRecipeIds.length > 0,
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
    for (const r of coverRecipesQ.data ?? []) map.set(r.id, r);
    return map;
  }, [coverRecipesQ.data]);

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
      coverImages,
      members,
      isFavorite: b.isFavorite ?? false,
    };
  };

  const booksWithFriends = useMemo(
    () => books.filter((b) => b.members.length > 1).map(buildBookCard),
    [books, recipeById, userById, myId],
  );

  const sharedWithMe = useMemo(
    () => books.filter((b) => b.ownerId !== myId).map(buildBookCard),
    [books, recipeById, userById, myId],
  );

  const favorites = useMemo(
    () => (favRecipesQ.data?.items ?? []).map(toRecipeCard),
    [favRecipesQ.data],
  );

  return {
    isLoading:
      recentlyViewedQ.isLoading ||
      booksQ.isLoading ||
      favRecipesQ.isLoading ||
      coverRecipesQ.isLoading ||
      usersQ.isLoading,
    recentlyViewed: recentlyViewedQ.items,
    booksWithFriends,
    sharedWithMe,
    favorites,
  };
}
