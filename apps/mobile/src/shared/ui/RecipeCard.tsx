import { Image } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { FavoriteButton } from '@/shared/ui/FavoriteButton';

export const FEED_CARD_WIDTH = 160;
export const FEED_CARD_HEIGHT = 220;
export const FEED_CARD_RADIUS = 5;
export const FEED_CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
} as const;
const IMAGE_HEIGHT = 140;

export interface RecipeCardData {
  id: string;
  name: string;
  imageUrl?: string;
  durationMinutes?: number;
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
      width={FEED_CARD_WIDTH}
      height={FEED_CARD_HEIGHT}
      borderRadius={FEED_CARD_RADIUS}
      overflow="hidden"
      backgroundColor="white"
      {...FEED_CARD_SHADOW}
      pressStyle={{ opacity: 0.92, scale: 0.98 }}
    >
      <YStack height={IMAGE_HEIGHT} backgroundColor="$gray4">
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={{ width: '100%', height: '100%' }} />
        ) : null}
      </YStack>

      <XStack
        flex={1}
        paddingHorizontal="$3"
        paddingVertical="$2"
        alignItems="center"
        justifyContent="space-between"
        gap="$2"
      >
        <YStack flex={1} gap={2}>
          <Text fontSize="$3" fontWeight="600" numberOfLines={1} color="$gray12">
            {recipe.name}
          </Text>
          {recipe.durationMinutes != null || recipe.tag ? (
            <Text fontSize="$1" color="$gray10" numberOfLines={1}>
              {recipe.durationMinutes != null ? `${recipe.durationMinutes} דק'` : ''}
              {recipe.durationMinutes != null && recipe.tag ? ' · ' : ''}
              {recipe.tag ?? ''}
            </Text>
          ) : null}
        </YStack>

        <FavoriteButton isFavorited={isFavorited} onPress={onToggleFavorite} size={20} />
      </XStack>
    </YStack>
  );
}
