import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import {
  categoryLabel,
  useCategories,
  useRecipeCategoryTag,
} from '@/features/categories/hooks/useCategories';
import { useToggleRecipeFavorite } from '@/features/home/hooks/useFavoriteMutations';
import { feedApi } from '@/features/home/api/feedApi';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { recipeToCard } from '@/shared/lib/recipeToCard';
import { RecipeCard } from '@/shared/ui/RecipeCard';
import { ShowAllScreen } from '@/shared/ui/ShowAllScreen';

export default function CategoryRecipesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const { byId } = useCategories();
  const tagOf = useRecipeCategoryTag();
  const toggleRecipe = useToggleRecipeFavorite();

  const recipesQ = useQuery({
    queryKey: ['recipes', 'by-category', id],
    queryFn: () => feedApi.recipesByCategory(id!),
    enabled: !!id,
  });

  const category = id ? byId.get(id) : undefined;
  const title = category ? categoryLabel(category, language) : '';
  const items = (recipesQ.data?.items ?? []).map((r) => recipeToCard(r, tagOf(r)));

  return (
    <ShowAllScreen
      title={title}
      data={items}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => (
        <RecipeCard
          recipe={item}
          isFavorited={item.isFavorite}
          onToggleFavorite={() => toggleRecipe.mutate({ id: item.id, next: !item.isFavorite })}
          onPress={() => router.push(`/recipes/${item.id}`)}
        />
      )}
    />
  );
}
