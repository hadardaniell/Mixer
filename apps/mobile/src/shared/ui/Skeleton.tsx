import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, View, type ViewProps } from 'tamagui';

interface SkeletonProps {
  width?: ViewProps['width'];
  height?: number;
  radius?: number;
  /** Staggers the sweep so a stack of bars doesn't pulse in lockstep. */
  delay?: number;
}

const SWEEP = 1400;

/**
 * A loading placeholder that sweeps.
 *
 * Prefer this over a spinner anywhere the final layout is predictable: showing
 * the *shape* of the content immediately makes the wait feel shorter than a
 * centered spinner does, and the screen never flashes empty.
 *
 * The sweep is a translating highlight rather than an opacity pulse — a pulse
 * on a whole block reads as an error state, a sweep reads as work in progress.
 */
export function Skeleton({ width = '100%', height = 14, radius = 8, delay = 0 }: SkeletonProps) {
  const theme = useTheme();
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withRepeat(
      withTiming(1, { duration: SWEEP, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );
  }, [p]);

  const style = useAnimatedStyle(() => {
    // `delay` is folded into the phase rather than using withDelay, so every bar
    // shares one clock and they stay in a fixed relationship forever.
    const phase = (p.value + delay) % 1;
    return { transform: [{ translateX: (phase * 2 - 1) * 260 }] };
  });

  return (
    <View
      width={width}
      height={height}
      borderRadius={radius}
      backgroundColor="$bgSubtle"
      overflow="hidden"
    >
      <Animated.View style={[{ width: '60%', height: '100%' }, style]}>
        <View
          width="100%"
          height="100%"
          backgroundColor={theme.surface?.val as string}
          opacity={0.75}
        />
      </Animated.View>
    </View>
  );
}
