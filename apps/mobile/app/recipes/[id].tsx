import { useLocalSearchParams } from 'expo-router';

import { RecipeScreen } from '@/features/recipe/screens/RecipeScreen';

export default function RecipeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RecipeScreen recipeId={id} />;
}
