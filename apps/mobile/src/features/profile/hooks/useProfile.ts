import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { PublicUser, Recipe, RecipeBook } from '@mixer/contracts';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { friendsApi } from '@/features/friends/api/friendsApi';
import { feedApi } from '@/features/home/api/feedApi';
import type { BookCardData } from '@/shared/ui/BookCard';
import type { RecipeCardData } from '@/shared/ui/RecipeCard';

const MAX_MEMBER_PREVIEWS = 3;

type RecipeCard = RecipeCardData & { isFavorite: boolean };
type BookCard = BookCardData & { isFavorite: boolean };

export interface ProfileData {
  user: PublicUser | null;
  /** Whether the profile being viewed belongs to the authenticated user. */
  isSelf: boolean;
  isLoading: boolean;
  stats: { recipes: number; books: number; friends: number };
  favoriteRecipes: RecipeCard[];
  favoriteBooks: BookCard[];
  recipes: RecipeCard[];
  books: BookCard[];
}

function toRecipeCard(r: Recipe): RecipeCard {
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

/**
 * Profile data for the given user (defaults to the authenticated user).
 *
 * Other users' libraries have no list endpoints yet, so books/recipes/favorites
 * are only fetched for the authenticated user (`isSelf`). A non-self profile
 * still resolves its header from `usersByIds`, and the tabs render empty until a
 * social/profile API exists. The friends count is fetched for the self profile;
 * other users' friend lists aren't exposed yet, so their count shows 0.
 */
export function useProfile(userId?: string): ProfileData {
  const { user: authUser } = useAuth();
  const isSelf = !userId || userId === authUser?.id;

  const otherUserQ = useQuery({
    queryKey: ['profile', 'user', userId],
    queryFn: () => feedApi.usersByIds([userId!]),
    enabled: !isSelf && !!userId,
  });

  // Share the `feed` query-key namespace so these dedupe with the home feed and
  // get refreshed by the favorite-toggle mutations' invalidations.
  const myRecipesQ = useQuery({
    queryKey: ['feed', 'my-recipes'],
    queryFn: () => feedApi.myRecipes(100),
    enabled: isSelf && !!authUser?.id,
  });

  const myBooksQ = useQuery({
    queryKey: ['feed', 'my-books'],
    queryFn: () => feedApi.myBooks(),
    enabled: isSelf && !!authUser?.id,
  });

  const favRecipesQ = useQuery({
    queryKey: ['feed', 'favorite-recipes'],
    queryFn: () => feedApi.favoriteRecipes(),
    enabled: isSelf && !!authUser?.id,
  });

  const favBooksQ = useQuery({
    queryKey: ['feed', 'favorite-books'],
    queryFn: () => feedApi.favoriteBooks(),
    enabled: isSelf && !!authUser?.id,
  });

  // Shares the `['friends']` key with the friends list + social mutations so the
  // count reconciles when a request is accepted or someone is unfriended.
  const friendsQ = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendsApi.list(),
    enabled: isSelf && !!authUser?.id,
    staleTime: 30_000,
  });

  const allBooks = useMemo(
    () => [...(myBooksQ.data?.items ?? []), ...(favBooksQ.data?.items ?? [])],
    [myBooksQ.data, favBooksQ.data],
  );

  // Resolve member avatars/names for every book we're about to render.
  const memberUserIds = useMemo(() => {
    const set = new Set<string>();
    for (const b of allBooks) for (const m of b.members) set.add(m.userId);
    return Array.from(set);
  }, [allBooks]);

  const usersQ = useQuery({
    queryKey: ['profile', 'book-members', memberUserIds.sort().join(',')],
    queryFn: () => feedApi.usersByIds(memberUserIds),
    enabled: memberUserIds.length > 0,
  });

  const userById = useMemo(() => {
    const map = new Map<string, PublicUser>();
    for (const u of usersQ.data?.items ?? []) map.set(u.id, u);
    return map;
  }, [usersQ.data]);

  const myId = authUser?.id;

  const buildBookCard = useMemo(
    () =>
      (b: RecipeBook): BookCard => ({
        id: b.id,
        name: b.name,
        recipeCount: b.recipeIds.length,
        coverKey: b.coverKey,
        coverImageUrl: b.coverImageUrl,
        members: b.members
          .filter((m) => m.userId !== myId)
          .slice(0, MAX_MEMBER_PREVIEWS + 1)
          .map((m) => {
            const u = userById.get(m.userId);
            return { id: m.userId, displayName: u?.displayName ?? '?', avatarUrl: u?.avatarUrl };
          }),
        isFavorite: b.isFavorite ?? false,
      }),
    [userById, myId],
  );

  const user = isSelf ? authUser : (otherUserQ.data?.items[0] ?? null);

  const recipes = useMemo(
    () => (myRecipesQ.data?.items ?? []).map(toRecipeCard),
    [myRecipesQ.data],
  );
  const books = useMemo(
    () => (myBooksQ.data?.items ?? []).map(buildBookCard),
    [myBooksQ.data, buildBookCard],
  );
  const favoriteRecipes = useMemo(
    () => (favRecipesQ.data?.items ?? []).map(toRecipeCard),
    [favRecipesQ.data],
  );
  const favoriteBooks = useMemo(
    () => (favBooksQ.data?.items ?? []).map(buildBookCard),
    [favBooksQ.data, buildBookCard],
  );

  return {
    user,
    isSelf,
    isLoading:
      otherUserQ.isLoading ||
      myRecipesQ.isLoading ||
      myBooksQ.isLoading ||
      favRecipesQ.isLoading ||
      favBooksQ.isLoading,
    stats: {
      recipes: recipes.length,
      books: books.length,
      friends: friendsQ.data?.friends.length ?? 0,
    },
    favoriteRecipes,
    favoriteBooks,
    recipes,
    books,
  };
}
