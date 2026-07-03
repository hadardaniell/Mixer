import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { YStack } from 'tamagui';

import { ImportRecipeCard } from '@/features/home/components/ImportRecipeCard';
import {
  useToggleBookFavorite,
  useToggleRecipeFavorite,
} from '@/features/home/hooks/useFavoriteMutations';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { BookCard, type BookCardData } from '@/shared/ui/BookCard';
import { FeedSection } from '@/shared/ui/FeedSection';
import { RecipeCard, type RecipeCardData } from '@/shared/ui/RecipeCard';

/** Feed mode body: the import CTA + the horizontal feed sections. */
export function HomeFeedSections() {
  const { t } = useTranslation();
  const router = useRouter();
  const feed = useHomeFeed();
  const toggleRecipe = useToggleRecipeFavorite();
  const toggleBook = useToggleBookFavorite();

  const openNewRecipe = () => router.navigate('/new-recipe');
  const openRecipe = (id: string) => router.push(`/recipes/${id}` as never);
  const openBook = (id: string) => router.push(`/books/${id}` as never);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <YStack gap="$3">
        <YStack paddingHorizontal="$4">
          <ImportRecipeCard onCreatePress={openNewRecipe} />
        </YStack>

        <FeedSection<RecipeCardData & { isFavorite: boolean }>
          title={t('home.recentlyViewed')}
          data={feed.recentlyViewed}
          keyExtractor={(r) => r.id}
          onSeeMore={() => router.push('/recipes/recent' as never)}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              isFavorited={item.isFavorite}
              onToggleFavorite={() => toggleRecipe.mutate({ id: item.id, next: !item.isFavorite })}
              onPress={() => openRecipe(item.id)}
            />
          )}
        />

        <FeedSection<BookCardData & { isFavorite: boolean }>
          title={t('home.booksWithFriends')}
          data={feed.booksWithFriends}
          keyExtractor={(b) => b.id}
          onSeeMore={() => router.push('/books/friends' as never)}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              isFavorited={item.isFavorite}
              onToggleFavorite={() => toggleBook.mutate({ id: item.id, next: !item.isFavorite })}
              onPress={() => openBook(item.id)}
            />
          )}
        />

        <FeedSection<RecipeCardData & { isFavorite: boolean }>
          title={t('home.sharedWithMe')}
          data={feed.sharedWithMe}
          keyExtractor={(r) => r.id}
          onSeeMore={() => router.push('/recipes/shared' as never)}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              isFavorited={item.isFavorite}
              onToggleFavorite={() => toggleRecipe.mutate({ id: item.id, next: !item.isFavorite })}
              onPress={() => openRecipe(item.id)}
            />
          )}
        />

        <FeedSection<RecipeCardData & { isFavorite: boolean }>
          title={t('home.favorites')}
          data={feed.favorites}
          keyExtractor={(r) => r.id}
          onSeeMore={() => router.push('/recipes/favorites' as never)}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              isFavorited={item.isFavorite}
              onToggleFavorite={() => toggleRecipe.mutate({ id: item.id, next: !item.isFavorite })}
              onPress={() => openRecipe(item.id)}
            />
          )}
        />
      </YStack>
    </ScrollView>
  );
}
