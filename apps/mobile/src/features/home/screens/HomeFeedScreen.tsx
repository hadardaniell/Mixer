import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { YStack } from 'tamagui';

import {
  useToggleBookFavorite,
  useToggleRecipeFavorite,
} from '@/features/home/hooks/useFavoriteMutations';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { BookCard, type BookCardData } from '@/shared/ui/BookCard';
import { FeedSection } from '@/shared/ui/FeedSection';
import { RecipeCard, type RecipeCardData } from '@/shared/ui/RecipeCard';
import { SearchInput } from '@/shared/ui/SearchInput';

export function HomeFeedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const feed = useHomeFeed();
  const toggleRecipe = useToggleRecipeFavorite();
  const toggleBook = useToggleBookFavorite();

  const openSearch = () => router.push('/search');
  const openRecipe = (id: string) => router.push(`/recipes/${id}`);
  const openBook = (id: string) => router.push(`/books/${id}`);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
    >
      <YStack gap="$5">
        <YStack paddingHorizontal="$4">
          <SearchInput onPress={openSearch} />
        </YStack>

        <FeedSection<RecipeCardData & { isFavorite: boolean }>
          title={t('home.recentlyImported')}
          data={feed.recentlyImported}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              isFavorited={item.isFavorite}
              onToggleFavorite={() =>
                toggleRecipe.mutate({ id: item.id, next: !item.isFavorite })
              }
              onPress={() => openRecipe(item.id)}
            />
          )}
        />

        <FeedSection<BookCardData & { isFavorite: boolean }>
          title={t('home.booksWithFriends')}
          data={feed.booksWithFriends}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              isFavorited={item.isFavorite}
              onToggleFavorite={() =>
                toggleBook.mutate({ id: item.id, next: !item.isFavorite })
              }
              onPress={() => openBook(item.id)}
            />
          )}
        />

        <FeedSection<BookCardData & { isFavorite: boolean }>
          title={t('home.sharedWithMe')}
          data={feed.sharedWithMe}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              isFavorited={item.isFavorite}
              onToggleFavorite={() =>
                toggleBook.mutate({ id: item.id, next: !item.isFavorite })
              }
              onPress={() => openBook(item.id)}
            />
          )}
        />

        <FeedSection<RecipeCardData & { isFavorite: boolean }>
          title={t('home.favorites')}
          data={feed.favorites}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              isFavorited={item.isFavorite}
              onToggleFavorite={() =>
                toggleRecipe.mutate({ id: item.id, next: !item.isFavorite })
              }
              onPress={() => openRecipe(item.id)}
            />
          )}
        />
      </YStack>
    </ScrollView>
  );
}
