import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { CategoryChip } from '@/features/categories/components/CategoryChip';
import {
  categoryLabel,
  useCategories,
  useRecipeCategoryTag,
} from '@/features/categories/hooks/useCategories';
import { feedApi } from '@/features/home/api/feedApi';
import {
  useToggleBookFavorite,
  useToggleRecipeFavorite,
} from '@/features/home/hooks/useFavoriteMutations';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { bookToCard } from '@/shared/lib/bookToCard';
import { recipeToCard } from '@/shared/lib/recipeToCard';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { BookCard } from '@/shared/ui/BookCard';
import { RecipeCard } from '@/shared/ui/RecipeCard';

const MIN_QUERY = 2;

interface HomeSearchViewProps {
  query: string;
}

/**
 * Search mode body: category chips for quick browsing, plus free-text results
 * over recipes and books once the query is long enough.
 */
export function HomeSearchView({ query }: HomeSearchViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { language } = useLanguage();
  const { categories } = useCategories();
  const tagOf = useRecipeCategoryTag();
  const toggleRecipe = useToggleRecipeFavorite();
  const toggleBook = useToggleBookFavorite();
  const primary = theme.primary?.val as string;

  const debounced = useDebouncedValue(query.trim(), 300);
  const enabled = debounced.length >= MIN_QUERY;

  const recipesQ = useQuery({
    queryKey: ['search', 'recipes', debounced],
    queryFn: () => feedApi.searchRecipes(debounced),
    enabled,
  });
  const booksQ = useQuery({
    queryKey: ['search', 'books', debounced],
    queryFn: () => feedApi.searchBooks(debounced),
    enabled,
  });

  const recipes = recipesQ.data?.items ?? [];
  const books = booksQ.data?.items ?? [];
  const loading = enabled && (recipesQ.isLoading || booksQ.isLoading);
  const noResults = enabled && !loading && recipes.length === 0 && books.length === 0;

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <YStack gap="$4" paddingTop="$2">
        <XStack flexWrap="wrap" gap="$2" paddingHorizontal="$4">
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={categoryLabel(c, language)}
              onPress={() => router.push(`/recipes/category/${c.id}` as never)}
            />
          ))}
        </XStack>

        {loading ? (
          <YStack paddingVertical="$5" alignItems="center">
            <ActivityIndicator color={primary} />
          </YStack>
        ) : null}

        {recipes.length > 0 ? (
          <YStack gap="$2">
            <Text paddingHorizontal="$4" fontSize={17} fontWeight="700" color="$text">
              {t('search.recipes')}
            </Text>
            <XStack flexWrap="wrap" gap={12} paddingHorizontal="$4">
              {recipes.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={recipeToCard(r, tagOf(r))}
                  isFavorited={r.isFavorite ?? false}
                  onToggleFavorite={() =>
                    toggleRecipe.mutate({ id: r.id, next: !(r.isFavorite ?? false) })
                  }
                  onPress={() => router.push(`/recipes/${r.id}` as never)}
                />
              ))}
            </XStack>
          </YStack>
        ) : null}

        {books.length > 0 ? (
          <YStack gap="$2">
            <Text paddingHorizontal="$4" fontSize={17} fontWeight="700" color="$text">
              {t('search.books')}
            </Text>
            <YStack gap={12} paddingHorizontal="$4">
              {books.map((b) => (
                <BookCard
                  key={b.id}
                  book={bookToCard(b)}
                  width="100%"
                  isFavorited={b.isFavorite ?? false}
                  onToggleFavorite={() =>
                    toggleBook.mutate({ id: b.id, next: !(b.isFavorite ?? false) })
                  }
                  onPress={() => router.push(`/books/${b.id}` as never)}
                />
              ))}
            </YStack>
          </YStack>
        ) : null}

        {noResults ? (
          <Text textAlign="center" color="$textMuted" fontSize={15} paddingVertical="$5">
            {t('search.noResults', { query: debounced })}
          </Text>
        ) : null}
      </YStack>
    </ScrollView>
  );
}
