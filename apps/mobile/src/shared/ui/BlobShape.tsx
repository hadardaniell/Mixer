import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'tamagui';

/**
 * Soft organic blob — the shape language from the project's original mood
 * board, where every quick action sits on one.
 *
 * CSS can morph a blob by animating four percentage border-radii; React Native
 * only accepts numeric `borderRadius`, so that trick isn't available. Instead
 * the shape is a fixed SVG path that rotates and breathes very slowly, which
 * reads as the same kind of life without any path interpolation.
 */

/** Four hand-tuned silhouettes so a row of blobs never looks stamped. */
const PATHS = [
  'M53.3,10.2c14.6,1.9,26.9,11.4,32.6,24.4c5.7,13,4.8,29.4-3.9,40.9c-8.7,11.5-25.2,18-40.3,15.6C26.6,88.7,12.9,77.4,8.6,63.2C4.3,49,9.4,32,20.6,21.3C31.8,10.6,38.7,8.3,53.3,10.2z',
  'M45.8,8.6c16.4-1.4,33.1,7.4,40.2,21.4c7.1,14,4.6,33.2-6.1,44.9c-10.7,11.7-29.6,15.9-44.4,10.2C20.7,79.4,9.8,63.8,8.3,47.6C6.8,31.4,14.7,14.6,29.4,10.6C34.6,9.2,40.4,9.1,45.8,8.6z',
  'M50.6,7.9c17.8,0,35.9,10.7,40.4,26.1c4.5,15.4-4.6,35.5-19.2,44.9c-14.6,9.4-34.7,8.1-45.9-2.5C14.7,65.8,12.4,45.9,16.6,30.9C20.8,15.9,32.8,7.9,50.6,7.9z',
  'M42.9,9.4c15.9-3.3,34.3,3.1,42.4,16.1c8.1,13,6,32.6-3.4,45.2c-9.4,12.6-26.1,18.2-40.6,14.4C26.8,81.3,14.5,68.1,10.6,52.6C6.7,37.1,11.2,19.3,23.6,13.2C29.8,10.2,37,10.6,42.9,9.4z',
];

interface BlobShapeProps {
  size: number;
  /** A theme alias (`$accentLavender` or `accentLavender`) or a raw hex. */
  color: string;
  /** Picks one of the four silhouettes and offsets the animation phase. */
  variant?: number;
}

export function BlobShape({ size, color, variant = 0 }: BlobShapeProps) {
  const theme = useTheme();
  const t = useSharedValue(0);
  const i = ((variant % PATHS.length) + PATHS.length) % PATHS.length;

  // react-native-svg has no idea what a Tamagui token is: handing `fill` the
  // string "$accentLavender" silently paints the blob black. Resolve here so
  // every call-site can pass a token the same way the rest of the app does.
  const key = color.startsWith('$') ? color.slice(1) : color;
  const fill = color.startsWith('#')
    ? color
    : ((theme as Record<string, { val: string } | undefined>)[key]?.val ?? color);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 11000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [t]);

  const style = useAnimatedStyle(() => {
    // A full slow revolution plus a gentle breath. Both are deliberately out of
    // phase with each other so the loop never looks like it "restarts".
    const phase = t.value + i * 0.25;
    return {
      transform: [
        { rotate: `${phase * 360}deg` },
        { scale: 1 + 0.05 * Math.sin(phase * Math.PI * 2) },
      ],
    };
  });

  return (
    <Animated.View style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d={PATHS[i]} fill={fill} />
      </Svg>
    </Animated.View>
  );
}
