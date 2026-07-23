import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, View, YStack } from 'tamagui';

/**
 * The Mixer mark, alive: a line-art bowl with a whisk that stirs and three
 * steam wisps rising on staggered loops.
 *
 * Built from Views + Reanimated rather than a bitmap or Lottie, so it inherits
 * theme tokens and stays crisp at any density. Motion — not color — is where
 * this design language gets its energy, and this is the anchor of it.
 */

const WISP_DELAYS = [0, 520, 1040];
const STEAM_DURATION = 1900;
const STIR_DURATION = 1500;

export function StirringBowl({ size = 56 }: { size?: number }) {
  // Every dimension below is authored against a nominal 56px mark.
  const s = size / 56;

  return (
    <YStack width={size} height={size} alignItems="center" justifyContent="flex-end">
      <YStack
        position="absolute"
        top={0}
        width="100%"
        height={18 * s}
        flexDirection="row"
        alignItems="flex-end"
        justifyContent="center"
        gap={7 * s}
      >
        {WISP_DELAYS.map((delay) => (
          <SteamWisp key={delay} delay={delay} scale={s} />
        ))}
      </YStack>

      <Whisk scale={s} />
      <Bowl scale={s} />
    </YStack>
  );
}

/** One wisp: rises, fades in then out, drifting slightly sideways. */
function SteamWisp({ delay, scale }: { delay: number; scale: number }) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: STEAM_DURATION, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p < 0.2 ? p / 0.2 : (1 - p) / 0.8,
      transform: [
        { translateY: -10 * scale * p },
        { translateX: 2.5 * scale * Math.sin(p * Math.PI * 2) },
        { scaleY: 0.7 + 0.5 * p },
      ],
    };
  });

  return (
    <Animated.View style={style}>
      <View
        width={2 * scale}
        height={12 * scale}
        borderRadius={999}
        backgroundColor={theme.textSubtle?.val as string}
      />
    </Animated.View>
  );
}

/** The whisk leans into the bowl and sweeps back and forth. */
function Whisk({ scale }: { scale: number }) {
  const tilt = useSharedValue(0);

  useEffect(() => {
    tilt.value = withRepeat(
      withSequence(
        withTiming(1, { duration: STIR_DURATION, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: STIR_DURATION, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [tilt]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-13 + tilt.value * 8}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 14 * scale,
          alignItems: 'center',
          // Pivot at the grip so the head sweeps, not the whole tool.
          transformOrigin: 'bottom center',
        },
        style,
      ]}
    >
      <View width={2 * scale} height={26 * scale} borderRadius={999} backgroundColor="$text" />
      <View
        width={9 * scale}
        height={12 * scale}
        borderWidth={1.8 * scale}
        borderColor="$text"
        borderTopWidth={0}
        borderBottomLeftRadius={999}
        borderBottomRightRadius={999}
        marginTop={-1 * scale}
      />
    </Animated.View>
  );
}

/** Line-art bowl: a rim bar over a half-capsule body. */
function Bowl({ scale }: { scale: number }) {
  return (
    <YStack alignItems="center">
      <View
        width={46 * scale}
        height={2 * scale}
        borderRadius={999}
        backgroundColor="$text"
        zIndex={1}
      />
      <View
        width={38 * scale}
        height={19 * scale}
        borderWidth={2 * scale}
        borderTopWidth={0}
        borderColor="$text"
        borderBottomLeftRadius={999}
        borderBottomRightRadius={999}
      />
    </YStack>
  );
}
