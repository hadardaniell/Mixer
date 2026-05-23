import { Image } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { FavoriteButton } from '@/shared/ui/FavoriteButton';

export interface RecipeCardData {
  id: string;
  name: string;
  imageUrl: string;
  durationMinutes: number;
  tag?: string;
}

interface RecipeCardProps {
  recipe: RecipeCardData;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
}

export function RecipeCard({ recipe, isFavorited, onToggleFavorite, onPress }: RecipeCardProps) {
  return (
    <YStack
      onPress={onPress}
      width={170}
      height={210}
      borderRadius="$6"
      overflow="hidden"
      backgroundColor="$gray3"
      pressStyle={{ opacity: 0.9, scale: 0.98 }}
    >
      <Image source={{ uri: recipe.imageUrl }} style={{ position: 'absolute', inset: 0 }} />

      <XStack position="absolute" top="$2" right="$2">
        <FavoriteButton isFavorited={isFavorited} onPress={onToggleFavorite} />
      </XStack>

      <YStack
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        padding="$3"
        gap="$1"
        backgroundColor="rgba(0,0,0,0.45)"
      >
        <Text color="white" fontSize="$4" fontWeight="600" numberOfLines={1}>
          {recipe.name}
        </Text>
        <Text color="white" fontSize="$2" opacity={0.85}>
          {recipe.durationMinutes} דק{recipe.tag ? ` · ${recipe.tag}` : ''}
        </Text>
      </YStack>
    </YStack>
  );
}
