import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

/** One organic "blob" silhouette — same shape for every dot, deliberately not a
 *  perfect circle. Drawn once, tinted + sized per dot. */
const BLOB_PATH = 'M54 7 C76 6 95 24 93 48 C91 70 76 95 49 93 C25 91 5 72 8 45 C11 22 32 9 54 7 Z';

/** The train's pastels, in order — kept as literal hex (a decorative content
 *  palette, like the book-cover swatches) so the loader looks exactly as
 *  designed and never depends on a theme token resolving. */
const COLORS = ['#FBDFEC', '#FFE1C6', '#C6E7DF', '#C8DEF1', '#D6DCFF', '#CDE7E0', '#F7D9E8'];

const COUNT = 7; // dots in the train
const ARC = 250; // degrees the train spans around the ring
const DURATION = 2000; // one calm orbit (slower)

interface LoaderProps {
  /** Overall diameter in px. */
  size?: number;
}

/**
 * The app's loading indicator: an orbiting "train" of organic pastel blobs — a
 * bright leader at the head, the rest trailing behind with decaying size and
 * opacity, the whole ring turning slowly. Colours come from the cool tint ramp
 * (a set of peers), resolved to hex since `react-native-svg` can't read tokens.
 *
 * Only the ring container animates (a compositor transform), so it stays smooth
 * on web too. Honors reduce-motion by holding a still ring.
 */
export function Loader({ size = 64 }: LoaderProps) {
  const reduce = useReducedMotion();

  const scale = size / 64;
  const radius = 24 * scale;
  const head = 15 * scale;
  const box = size;

  const rot = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    rot.value = withRepeat(withTiming(360, { duration: DURATION, easing: Easing.linear }), -1, false);
  }, [reduce, rot]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  const step = ARC / (COUNT - 1);

  return (
    <Animated.View style={[{ width: box, height: box }, ringStyle]}>
      {Array.from({ length: COUNT }).map((_, i) => {
        const t = i / (COUNT - 1); // 0 head → 1 tail
        const dot = head * (1 - t * 0.55);
        const angle = -step * i; // head leads, tail trails
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginLeft: -dot / 2,
              marginTop: -dot / 2,
              opacity: 1 - t * 0.72,
              transform: [{ rotate: `${angle}deg` }, { translateY: -radius }],
            }}
          >
            <Svg width={dot} height={dot} viewBox="0 0 100 100">
              <Path d={BLOB_PATH} fill={COLORS[i % COLORS.length]} />
            </Svg>
          </View>
        );
      })}
    </Animated.View>
  );
}
