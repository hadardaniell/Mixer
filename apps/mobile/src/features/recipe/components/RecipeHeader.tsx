import type { Recipe } from '@mixer/contracts';
import { ArrowRight, Share2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Image, Pressable } from 'react-native';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { FavoriteButton } from '@/shared/ui/FavoriteButton';
import { useIsRtl } from '@/shared/lib/useIsRtl';

import { RecipeMetaTags } from './RecipeMetaTags';

interface RecipeHeaderProps {
  recipe: Recipe;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onBack: () => void;
}

const COVER_HEIGHT = 240;

/**
 * Cover image with an overlaid action row (back on the start side, share +
 * favorite on the end side — flips with language), followed by the centered
 * title, description and meta chips.
 */
export function RecipeHeader({
  recipe,
  isFavorited,
  onToggleFavorite,
  onShare,
  onBack,
}: RecipeHeaderProps) {
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;

  return (
    <YStack gap="$3">
      <View height={COVER_HEIGHT} borderRadius={24} overflow="hidden" backgroundColor="$bgSubtle">
        {recipe.coverImageUrl ? (
          <Image source={{ uri: recipe.coverImageUrl }} style={{ width: '100%', height: '100%' }} />
        ) : null}

        <XStack
          position="absolute"
          top={16}
          left={16}
          right={16}
          alignItems="center"
          justifyContent="space-between"
          style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
        >
          <CircleIconButton onPress={onBack} opacity={0.8}>
            <ArrowRight size={24} color={ink} />
          </CircleIconButton>

          <XStack alignItems="center" gap="$2">
            <CircleIconButton onPress={onShare}>
              <Share2 size={20} color={ink} />
            </CircleIconButton>
            <FavoriteButton isFavorited={isFavorited} onPress={onToggleFavorite} />
          </XStack>
        </XStack>
      </View>

      <YStack gap="$2" alignItems="center" paddingHorizontal="$2">
        <Text fontSize={26} fontWeight="700" letterSpacing={-0.5} color="$text" textAlign="center">
          {recipe.title}
        </Text>
        {recipe.description ? (
          <Text fontSize={15} color="$textMuted" lineHeight={22} textAlign="center">
            {recipe.description}
          </Text>
        ) : null}
      </YStack>

      <RecipeMetaTags recipe={recipe} />
    </YStack>
  );
}

function CircleIconButton({
  onPress,
  children,
  opacity,
}: {
  onPress: () => void;
  children: ReactNode;
  opacity?: number;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8}>
      <YStack
        width={40}
        height={40}
        borderRadius={20}
        backgroundColor="$surface"
        opacity={opacity}
        alignItems="center"
        justifyContent="center"
        shadowColor="black"
        shadowOpacity={0.08}
        shadowRadius={8}
        shadowOffset={{ width: 0, height: 2 }}
        elevation={3}
        pressStyle={{ opacity: 0.85 }}
      >
        {children}
      </YStack>
    </Pressable>
  );
}
