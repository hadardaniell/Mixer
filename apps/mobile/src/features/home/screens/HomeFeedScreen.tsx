import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';

import { HomeHeader } from '@/features/home/components/HomeHeader';
import { ImportRecipeCard } from '@/features/home/components/ImportRecipeCard';
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
  const insets = useSafeAreaInsets();
  const feed = useHomeFeed();
  const toggleRecipe = useToggleRecipeFavorite();
  const toggleBook = useToggleBookFavorite();

  const openSearch = () => router.push('/search');
  const openRecipe = (id: string) => router.push(`/recipes/${id}` as never);
  const openBook = (id: string) => router.push(`/books/${id}` as never);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: 120, // clear the floating tab bar
      }}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap="$4">
        <YStack paddingHorizontal="$4">
          <HomeHeader onNotificationsPress={() => {}} />
        </YStack>

        <YStack paddingHorizontal="$4">
          <SearchInput onPress={openSearch} />
        </YStack>

        <YStack paddingHorizontal="$4">
          <ImportRecipeCard onCreatePress={openSearch} />
        </YStack>

        <FeedSection<RecipeCardData & { isFavorite: boolean }>
          title={t('home.recentlyViewed')}
          data={feed.recentlyViewed}
          keyExtractor={(r) => r.id}
          emptyText={t('home.emptySection')}
          onSeeMore={() => router.push('/recipes/recent' as never)}
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
          emptyText={t('home.emptySection')}
          onSeeMore={() => router.push('/books/friends' as never)}
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
          emptyText={t('home.emptySection')}
          onSeeMore={() => router.push('/recipes/shared' as never)}
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
          emptyText={t('home.emptySection')}
          onSeeMore={() => router.push('/recipes/favorites' as never)}
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
