import type { LucideIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text, View, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import { BlobShape } from '@/shared/ui/BlobShape';

interface BlobActionCardProps {
  Icon: LucideIcon;
  label: string;
  onPress: () => void;
  /** Theme alias for the blob tint, e.g. `$accentLavender`. */
  blobColor: string;
  /** Selects the blob silhouette so a grid of these never looks stamped. */
  variant?: number;
}

const CARD_HEIGHT = 124;
const BLOB_SIZE = 78;
const DISC_SIZE = 48;
const BLOB_OFFSET = -14;

/**
 * A quick-action tile: a colored blob bleeding out of the top corner with a
 * solid ink disc on top, label underneath.
 *
 * Three things here are load-bearing and easy to get wrong:
 *
 * 1. **Two layers.** The shadow lives on the outer stack and the clipping on the
 *    inner one. Put `overflow: hidden` and a shadow on the same view and the
 *    shadow silently disappears — the same trap `RecipeCard` documents.
 * 2. **`left`/`right`, not `start`/`end`.** Tamagui doesn't resolve logical
 *    inset props for absolute positioning, so `end={-14}` is ignored and the
 *    blob falls back to the centre of the flex line. The side is picked
 *    explicitly from the app direction instead.
 * 3. **The blob is cropped on purpose.** Anchored past the corner and cut by the
 *    card, it reads as a printed shape rather than a badge.
 *
 * The contrast is the whole idea: a soft pastel silhouette under a hard
 * near-black circle. The blob supplies warmth, the disc supplies authority, and
 * neither needs the brand color to do its job.
 */
export function BlobActionCard({
  Icon,
  label,
  onPress,
  blobColor,
  variant = 0,
}: BlobActionCardProps) {
  const isRtl = useIsRtl();
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.045 * pressed.value }],
    opacity: 1 - 0.08 * pressed.value,
  }));

  // The blob hugs the corner nearest the card's trailing edge in both
  // directions, matching how the mood board frames it.
  const cornerSide = isRtl ? { left: BLOB_OFFSET } : { right: BLOB_OFFSET };

  return (
    <Animated.View style={[{ flex: 1 }, animStyle]}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withTiming(1, { duration: 90 });
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, { damping: 14, stiffness: 260 });
        }}
      >
        {/* Outer layer: shadow only, never clipped. */}
        <YStack
          height={CARD_HEIGHT}
          borderRadius={18}
          backgroundColor="$surface"
          shadowColor="black"
          shadowOpacity={0.28}
          shadowRadius={14}
          shadowOffset={{ width: 0, height: 6 }}
          elevation={10}
        >
          {/* Inner layer: clipping only, never shadowed. */}
          <YStack
            flex={1}
            borderRadius={18}
            overflow="hidden"
            alignItems="center"
            justifyContent="center"
            gap="$2.5"
          >
            <View position="absolute" top={BLOB_OFFSET} {...cornerSide}>
              <BlobShape size={BLOB_SIZE} color={blobColor} variant={variant} />
            </View>

            <YStack
              width={DISC_SIZE}
              height={DISC_SIZE}
              borderRadius={999}
              // `$text` is #111827 — the exact ink from the mood board's discs.
              backgroundColor="$text"
              alignItems="center"
              justifyContent="center"
            >
              <Icon size={22} color="#FFFFFF" strokeWidth={1.9} />
            </YStack>

            <Text color="$text" fontSize={14} fontWeight="700">
              {label}
            </Text>
          </YStack>
        </YStack>
      </Pressable>
    </Animated.View>
  );
}
