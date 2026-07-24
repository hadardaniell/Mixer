import { useEffect, useId } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme, View } from 'tamagui';

/**
 * The Mixer mark — a line-art bowl with a soft pastel "mix" swirling inside and
 * a periwinkle→rose gradient rim, plus a whisk. This is the single bowl used
 * everywhere: the Start hero, the auth screens' mark, and the home CTA, so all
 * three read as one product.
 *
 * Static by default (a logo/mark). Pass `animated` where the bowl is the hero:
 * three motions layered exactly like the design source — the whole bowl rocks
 * ±1°, the whisk stirs ±14°, and the mix swirls a slow 360°. Colors resolve
 * from theme tokens (dark-mode aware); `react-native-svg` can't read Tamagui
 * tokens, so — like `BlobShape` — we resolve them here before handing over hex.
 */

const VB_W = 172;
const VB_H = 150;

const AnimatedG = Animated.createAnimatedComponent(G);

interface MixerBowlProps {
  /** Rendered width in px. Height derives from the bowl's aspect ratio. */
  size?: number;
  /** Rock the bowl, stir the whisk, swirl the mix. Off = a still mark. */
  animated?: boolean;
}

export function MixerBowl({ size = 120, animated = false }: MixerBowlProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  // Unique gradient/clip ids so two bowls on one screen don't share defs.
  const uid = useId().replace(/:/g, '');
  const height = (size * VB_H) / VB_W;

  const ink = theme.text?.val as string;
  const rimStart = theme.primary?.val as string;
  const rimEnd = theme.accentBowlRim?.val as string;
  const mix = {
    pink: theme.accentPink?.val as string,
    lavender: theme.accentLavender?.val as string,
    mint: theme.accentMint?.val as string,
    sky: theme.tintSky?.val as string,
    peach: theme.accentPeach?.val as string,
  };

  // Rest at 0 so the still mark is upright; the effect drives them only when
  // animated, oscillating through 0.
  const stir = useSharedValue(0); // whisk sweep, −1..1
  const wob = useSharedValue(0); // bowl rock, −1..1
  const spin = useSharedValue(0); // mix swirl, 0..1

  useEffect(() => {
    if (!animated || reduceMotion) return;
    stir.value = -1;
    stir.value = withRepeat(withTiming(1, { duration: 550, easing: Easing.inOut(Easing.sin) }), -1, true);
    wob.value = -1;
    wob.value = withRepeat(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }), -1, true);
    spin.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false);
  }, [animated, reduceMotion, stir, wob, spin]);

  const bowlStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wob.value}deg` }] }));
  const whiskProps = useAnimatedProps(() => ({ rotation: stir.value * 14 }));
  const swirlProps = useAnimatedProps(() => ({ rotation: spin.value * 360 }));

  return (
    <Animated.View style={[{ width: size, height }, bowlStyle]}>
      <Svg width={size} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <ClipPath id={`clip${uid}`}>
            <Path d="M31 72c0 30 23 54 55 54s55-24 55-54Z" />
          </ClipPath>
          <LinearGradient id={`rim${uid}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={rimStart} />
            <Stop offset="1" stopColor={rimEnd} />
          </LinearGradient>
        </Defs>

        {/* The mix, clipped to the bowl body, swirling around its own centre. */}
        <G clipPath={`url(#clip${uid})`}>
          <AnimatedG originX={86} originY={92} animatedProps={swirlProps}>
            <Circle cx={72} cy={94} r={26} fill={mix.pink} />
            <Circle cx={104} cy={90} r={22} fill={mix.lavender} />
            <Circle cx={90} cy={106} r={18} fill={mix.mint} />
            <Circle cx={112} cy={106} r={13} fill={mix.sky} />
            <Circle cx={66} cy={104} r={12} fill={mix.peach} />
          </AnimatedG>
        </G>

        {/* Bowl outline + gradient rim. */}
        <G fill="none" stroke={ink} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M22 70h128" stroke={`url(#rim${uid})`} strokeWidth={5} />
          <Path d="M31 72c0 30 23 54 55 54s55-24 55-54" />
        </G>

        {/* Whisk, pivoting near the top of its handle so the head sweeps. */}
        <AnimatedG originX={86} originY={30} animatedProps={whiskProps}>
          <G fill="none" stroke={ink} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M86 66V24" />
            <Path d="M77 66c0-12 18-12 18 0" />
          </G>
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}
