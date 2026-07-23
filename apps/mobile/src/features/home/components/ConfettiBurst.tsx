import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, View } from 'tamagui';

/**
 * Confetti that keeps popping out of the stirring bowl.
 *
 * This is where the color lives on the home screen. Everything else is white,
 * ink and one restrained periwinkle — so six vivid chips, each on screen for
 * under a second, can be fully saturated without the screen ever reading as
 * loud. Scarcity in time, not just in area.
 */

/** Theme aliases, so the chips move with the palette instead of drifting from it. */
const CHIPS: { color: string; dx: number; dy: number }[] = [
  { color: 'accentCoral', dx: -26, dy: -20 },
  { color: 'accentTeal', dx: 24, dy: -26 },
  { color: 'accentYellow', dx: -20, dy: 22 },
  { color: 'primary', dx: 28, dy: 14 },
  { color: 'accentOrange', dx: 2, dy: -32 },
  { color: 'accentGreen', dx: -30, dy: 2 },
];

const CYCLE = 3200;

export function ConfettiBurst({ size = 74 }: { size?: number }) {
  return (
    <View
      position="absolute"
      top={0}
      left={0}
      width={size}
      height={size}
      alignItems="center"
      justifyContent="center"
      pointerEvents="none"
    >
      {CHIPS.map((c, i) => (
        <Chip key={c.color + i} {...c} delay={(i * CYCLE) / CHIPS.length} />
      ))}
    </View>
  );
}

function Chip({
  color,
  dx,
  dy,
  delay,
}: {
  color: string;
  dx: number;
  dy: number;
  delay: number;
}) {
  const theme = useTheme();
  const hex = (theme as Record<string, { val: string } | undefined>)[color]?.val ?? '#FF4D6D';
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: CYCLE, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [delay, p]);

  const style = useAnimatedStyle(() => {
    const v = p.value;
    return {
      // Fade in fast, linger, then dissolve — a linear fade reads as a blink.
      opacity: v < 0.18 ? v / 0.18 : Math.max(0, 1 - (v - 0.18) / 0.82),
      transform: [
        { translateX: dx * v },
        { translateY: dy * v },
        { rotate: `${v * 220}deg` },
        { scale: 0.4 + 0.6 * Math.min(1, v * 3) },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute' }, style]}>
      <View width={6} height={6} borderRadius={2} backgroundColor={hex} />
    </Animated.View>
  );
}
