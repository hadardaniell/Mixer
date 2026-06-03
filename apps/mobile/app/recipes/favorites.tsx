import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useToggleRecipeFavorite } from '@/features/home/hooks/useFavoriteMutations';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { RecipeCard } from '@/shared/ui/RecipeCard';
import { ShowAllScreen } from '@/shared/ui/ShowAllScreen';

export default function RecipesFavoritesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const feed = useHomeFeed();
  const toggleRecipe = useToggleRecipeFavorite();

  return (
    <ShowAllScreen
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
          onPress={() => router.push(`/recipes/${item.id}`)}
        />
      )}
    />
  );
}
