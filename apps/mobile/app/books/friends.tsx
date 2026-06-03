import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useToggleBookFavorite } from '@/features/home/hooks/useFavoriteMutations';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { BookCard } from '@/shared/ui/BookCard';
import { ShowAllScreen } from '@/shared/ui/ShowAllScreen';

export default function BooksFriendsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const feed = useHomeFeed();
  const toggleBook = useToggleBookFavorite();

  return (
    <ShowAllScreen
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
          onPress={() => router.push(`/books/${item.id}`)}
        />
      )}
    />
  );
}
