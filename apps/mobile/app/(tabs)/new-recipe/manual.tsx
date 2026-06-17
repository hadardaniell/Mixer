import { useLocalSearchParams } from 'expo-router';

import { CreateManualScreen } from '@/features/recipe/screens/CreateManualScreen';

export default function CreateManualRoute() {
  // `id` present → edit an existing recipe/draft; absent → create a new one.
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <CreateManualScreen recipeId={id} />;
}
