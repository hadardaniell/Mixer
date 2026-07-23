import type { Recipe } from '@mixer/contracts';
import { ArrowRight } from 'lucide-react-native';
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
  onBack: () => void;
}

const COVER_HEIGHT = 240;

/**
 * Cover image with an overlaid action row (back on the start side, favorite on
 * the end side — flips with language), followed by the centered title,
 * description and meta chips.
 */
export function RecipeHeader({ recipe, isFavorited, onToggleFavorite, onBack }: RecipeHeaderProps) {
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;

  return (
    <YStack gap="$3">
      <View height={COVER_HEIGHT} borderRadius={20} overflow="hidden" backgroundColor="$bgSubtle">
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
          <CircleIconButton onPress={onBack}>
            <ArrowRight size={22} color="#FFFFFF" strokeWidth={2} />
          </CircleIconButton>

          {/* Sharing lives only in the action bar below — one entry point. */}
          <FavoriteButton isFavorited={isFavorited} onPress={onToggleFavorite} />
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

/**
 * Translucent ink disc over the cover photo — you can still read the image
 * through it.
 *
 * The tint is `$overlay` (ink at 50%), not a translucent *white* circle: over an
 * unpredictable photograph a dark scrim with a white glyph stays legible on both
 * a dark sauce and a pale meringue, while white-on-white disappears entirely.
 *
 * The alpha lives in the background color rather than on an `opacity` prop —
 * `opacity` would fade the arrow along with the disc and cost the contrast the
 * scrim is there to buy.
 */
function CircleIconButton({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8}>
      <YStack
        width={40}
        height={40}
        borderRadius={999}
        backgroundColor="$overlay"
        alignItems="center"
        justifyContent="center"
        pressStyle={{ opacity: 0.75, scale: 0.94 }}
      >
        {children}
      </YStack>
    </Pressable>
  );
}
