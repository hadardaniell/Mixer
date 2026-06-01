import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useToggleBookFavorite } from '@/features/home/hooks/useFavoriteMutations';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { BookCard } from '@/shared/ui/BookCard';
import { ShowAllScreen } from '@/shared/ui/ShowAllScreen';

/**
 * "Shared with me" — currently derived from books I'm a viewer of. Will be
 * replaced with an explicit-shares-collection feed in the next iteration.
 */
export default function RecipesSharedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const feed = useHomeFeed();
  const toggleBook = useToggleBookFavorite();

  return (
    <ShowAllScreen
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
          onPress={() => router.push(`/books/${item.id}`)}
        />
      )}
    />
  );
}
