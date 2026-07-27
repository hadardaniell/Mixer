import { useEffect } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTheme } from 'tamagui';

import { MIXER_WORDMARK_PATH, MIXER_WORDMARK_VIEWBOX as VB } from './mixerWordmarkPath';

/** Soft reveal edge width, in px. */
const FADE = 46;

interface AppSplashProps {
  /** Begin the write-on. Passed `isReady` so the animation only runs once the
   *  boot work (fonts, i18n) is done and the JS thread is free — on web there's
   *  no separate UI thread, so animating during boot janks. */
  start: boolean;
  /** The app finished booting AND the min splash time elapsed — fade out now. */
  finished: boolean;
  /** Fired when the write-on animation completes, so the app can mount the
   *  children then (rather than during the animation) and keep it smooth. */
  onWritten: () => void;
  onHidden: () => void;
}

/**
 * The app-launch splash: the Mixer wordmark (cursive "mixer" with the whisk), in
 * the brand periwinkle on the app canvas, revealed left-to-right with a soft
 * edge as if it's being written.
 *
 * The reveal is a canvas-coloured cover that slides off to the right via
 * `translateX` — a compositor transform, so it stays buttery on web and native
 * (animating an SVG clip/mask janks on web). The cover's leading edge is a
 * transparent→canvas gradient, giving the soft "inking" edge. Fades out once the
 * app is ready; reduce-motion snaps to the finished wordmark.
 */
export function AppSplash({ start, finished, onWritten, onHidden }: AppSplashProps) {
  const theme = useTheme();
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();

  const bg = (theme.background?.val ?? theme.bg?.val) as string;
  const peri = theme.primary?.val as string;

  const logoWidth = Math.max(220, Math.min(360, width * 0.78));
  const logoHeight = (logoWidth * VB.height) / VB.width;
  const coverWidth = logoWidth + FADE;

  const progress = useSharedValue(0); // 0..1 reveal
  const exit = useSharedValue(1); // root opacity for the fade-out

  useEffect(() => {
    if (reduce) {
      progress.value = 1;
      onWritten();
      return;
    }
    // Only start once boot is done, so the write runs on a free thread (smooth).
    if (!start) return;
    progress.value = withDelay(
      120,
      withTiming(1, { duration: 1900, easing: Easing.bezier(0.3, 0.55, 0.25, 1) }, (done) => {
        if (done) runOnJS(onWritten)();
      }),
    );
  }, [start, reduce, progress, onWritten]);

  useEffect(() => {
    if (!finished) return;
    exit.value = withTiming(0, { duration: 380, easing: Easing.in(Easing.cubic) }, (done) => {
      if (done) runOnJS(onHidden)();
    });
  }, [finished, exit, onHidden]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: exit.value }));
  // Slide the cover off to the right to uncover the mark left-to-right.
  const coverStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * coverWidth }],
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
        { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        rootStyle,
      ]}
    >
      <View style={{ width: logoWidth, height: logoHeight, overflow: 'hidden' }}>
        <Svg
          width={logoWidth}
          height={logoHeight}
          viewBox={`${VB.x} ${VB.y} ${VB.width} ${VB.height}`}
        >
          <Path d={MIXER_WORDMARK_PATH} fill={peri} />
        </Svg>

        {/* Canvas-coloured cover with a soft leading edge; starts fully over the
            mark (shifted left by FADE) and slides off to the right. */}
        <Animated.View
          style={[
            { position: 'absolute', top: 0, left: -FADE, width: coverWidth, height: logoHeight },
            // Promote to its own compositor layer on web so the slide stays smooth.
            Platform.OS === 'web' ? ({ willChange: 'transform' } as never) : null,
            coverStyle,
          ]}
        >
          <Svg width={coverWidth} height={logoHeight}>
            <Defs>
              <LinearGradient id="splashCover" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={bg} stopOpacity={0} />
                <Stop offset={FADE / coverWidth} stopColor={bg} stopOpacity={1} />
                <Stop offset="1" stopColor={bg} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect width={coverWidth} height={logoHeight} fill="url(#splashCover)" />
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
