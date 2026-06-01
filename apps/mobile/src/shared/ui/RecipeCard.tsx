import { Image } from 'react-native';
import { Text, View, XStack, YStack } from 'tamagui';

import { FavoriteButton } from '@/shared/ui/FavoriteButton';

export const FEED_CARD_WIDTH = 180;
export const FEED_CARD_HEIGHT = 230;
export const FEED_CARD_RADIUS = 18;
export const FEED_CARD_SHADOW = {
  shadowColor: 'black' as const,
  shadowOpacity: 0.06,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};
const IMAGE_HEIGHT = 150;
const RADIUS = FEED_CARD_RADIUS;

export interface RecipeCardData {
  id: string;
  name: string;
  imageUrl?: string;
  durationMinutes?: number;
  /** Comma-separated category labels shown under the title (e.g. "מרקים · טבעוני"). */
  tag?: string;
}

export interface RecipeAttribution {
  name: string;
  avatarUrl?: string;
  /** Localized suffix like "שיתפה איתך" / "shared with you". */
  suffix: string;
}

interface RecipeCardProps {
  recipe: RecipeCardData;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
  /** When present, shows an attribution row at the top of the card. */
  attribution?: RecipeAttribution;
}

/**
 * Feed recipe card. Two visual modes:
 *  - Default: image with a time chip (top-right) and yellow favorite star
 *    (top-left), title + category subtitle below.
 *  - With `attribution`: an avatar + "X שיתפה איתך" row sits above the image
 *    (used by the "shared with me" feed row).
 */
export function RecipeCard({
  recipe,
  isFavorited,
  onToggleFavorite,
  onPress,
  attribution,
}: RecipeCardProps) {
  return (
    <YStack
      onPress={onPress}
      width={FEED_CARD_WIDTH}
      borderRadius={RADIUS}
      overflow="hidden"
      backgroundColor="$surface"
      shadowColor="black"
      shadowOpacity={0.06}
      shadowRadius={14}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={2}
      pressStyle={{ opacity: 0.92, scale: 0.98 }}
    >
      {attribution ? <AttributionRow attribution={attribution} /> : null}

      <YStack height={IMAGE_HEIGHT} backgroundColor="$bgSubtle">
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={{ width: '100%', height: '100%' }} />
        ) : null}

        {/* Time chip — top-right (start in RTL because of `start={8}`). */}
        {recipe.durationMinutes != null ? (
          <View
            position="absolute"
            top={8}
            start={8}
            paddingHorizontal={10}
            paddingVertical={3}
            borderRadius={999}
            backgroundColor="$surface"
          >
            <Text color="$text" fontSize={11} fontWeight="700">
              {recipe.durationMinutes} דק'
            </Text>
          </View>
        ) : null}

        {/* Favorite star — top-left (end in RTL because of `end={8}`). */}
        <View position="absolute" top={6} end={6}>
          <FavoriteButton isFavorited={isFavorited} onPress={onToggleFavorite} size={22} />
        </View>
      </YStack>

      <YStack paddingHorizontal="$3" paddingVertical="$2.5" gap={2} alignItems="center">
        <Text fontSize={14} fontWeight="700" numberOfLines={1} color="$text">
          {recipe.name}
        </Text>
        {recipe.tag ? (
          <Text fontSize={12} color="$textMuted" numberOfLines={1}>
            {recipe.tag}
          </Text>
        ) : null}
      </YStack>
    </YStack>
  );
}

function AttributionRow({ attribution }: { attribution: RecipeAttribution }) {
  return (
    <XStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$2">
      <View
        width={20}
        height={20}
        borderRadius={10}
        overflow="hidden"
        backgroundColor="$accentLavender"
      >
        {attribution.avatarUrl ? (
          <Image
            source={{ uri: attribution.avatarUrl }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : null}
      </View>
      <Text color="$textMuted" fontSize={11} numberOfLines={1} flex={1}>
        {attribution.name} {attribution.suffix}
      </Text>
    </XStack>
  );
}
