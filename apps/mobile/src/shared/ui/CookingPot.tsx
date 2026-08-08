import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme, View } from 'tamagui';

/**
 * The pot on the stove — shown while an import is being extracted.
 *
 * Deliberately not the mixer bowl: the bowl is the brand mark and appears on the
 * splash, the auth screens and the home CTA, so reusing it here would say "Mixer"
 * where the screen needs to say "cooking". Same drawing language though — 3.4pt ink
 * line art, and the rim carries the bowl's `$primary`→`$accentBowlRim` gradient, so
 * the two read as the same kitchen.
 *
 * Four motions on their own clocks: the broth level rises (a slow loop, the one that
 * carries "something is progressing"), its surface sways, the vegetables bob, and the
 * lid rattles. Reduce-motion leaves a full pot standing still — the composition still
 * reads, it just doesn't move.
 *
 * `react-native-svg` can't resolve Tamagui tokens, so colors are read off the theme
 * here and handed over as hex, the same as `BlobShape` and `MixerBowl`.
 */

const VB_W = 200;
const VB_H = 176;
/** How far below its resting place the broth starts, in viewBox units. */
const FILL_DROP = 50;

const AnimatedG = Animated.createAnimatedComponent(G);

interface CookingPotProps {
  /** Rendered width in px. Height derives from the drawing's aspect ratio. */
  size?: number;
}

export function CookingPot({ size = 200 }: CookingPotProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const height = (size * VB_H) / VB_W;

  const ink = theme.text?.val as string;
  const rimStart = theme.primary?.val as string;
  const rimEnd = theme.accentBowlRim?.val as string;
  // A pale butter stock rather than a carrot soup — the broth is the field the
  // vegetables sit in, so it stays quiet and lets them carry the colour. It's the
  // warm tint at partial strength; at full strength it read as orange and competed
  // with the carrot.
  const broth = theme.warningBorder?.val as string;
  const veg = {
    tomato: theme.accentCoral?.val as string,
    pea: theme.accentGreen?.val as string,
    carrot: theme.accentOrange?.val as string,
    beet: theme.accentPurple?.val as string,
  };

  // 0 = empty, 1 = full. The others oscillate through their rest value so the still
  // frame under reduce-motion is the same drawing, just parked.
  const level = useSharedValue(reduceMotion ? 1 : 0);
  const sway = useSharedValue(0); // −1..1, surface drift
  const bob = useSharedValue(0); // −1..1, vegetables
  const lid = useSharedValue(0); // 0..1, rattle

  useEffect(() => {
    if (reduceMotion) return;
    // The pot fills in ~3s and starts over. Brisk on purpose: at a slower tempo the
    // rising level read as a progress bar that had stalled, rather than as a boil.
    level.value = 0;
    level.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.cubic) }), -1, false);
    sway.value = -1;
    sway.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
    bob.value = -1;
    bob.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }), -1, true);
    lid.value = 0;
    lid.value = withRepeat(withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [reduceMotion, level, sway, bob, lid]);

  // The whole body of broth (surface + vegetables) rides one transform, so the
  // vegetables stay submerged as the level climbs instead of drifting apart from it.
  const fillProps = useAnimatedProps(() => ({ translateY: (1 - level.value) * FILL_DROP }));
  const swayProps = useAnimatedProps(() => ({ translateX: sway.value * 8 }));
  const bobProps = useAnimatedProps(() => ({ translateY: bob.value * 4 }));
  const lidProps = useAnimatedProps(() => ({ translateY: -lid.value * 5, rotation: -lid.value * 4 }));

  return (
    <View width={size} height={height}>
      <Svg width={size} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id="potRim" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={rimStart} />
            <Stop offset="1" stopColor={rimEnd} />
          </LinearGradient>
          <ClipPath id="potBody">
            <Path d="M46 78h108l-9 58a15 15 0 0 1-15 13H70a15 15 0 0 1-15-13z" />
          </ClipPath>
        </Defs>

        {/* Contents, clipped to the pot so the rising level is hidden until it's inside. */}
        <G clipPath="url(#potBody)">
          <AnimatedG animatedProps={fillProps}>
            <AnimatedG animatedProps={swayProps}>
              {/* Wavy surface, drawn wider than the pot so the sway never exposes an
                  edge. The body is washed out to keep it off orange; the surface line
                  is drawn at full strength so the level still reads as it climbs. */}
              <Path
                d="M24 100c14-7 28 7 42 0s28-7 42 0 28 7 44 0v76H24z"
                fill={broth}
                opacity={0.5}
              />
              <Path
                d="M24 100c14-7 28 7 42 0s28-7 42 0 28 7 44 0"
                fill="none"
                stroke={broth}
                strokeWidth={4}
                strokeLinecap="round"
              />
            </AnimatedG>
            <AnimatedG animatedProps={bobProps}>
              <Circle cx={78} cy={118} r={11} fill={veg.tomato} />
              <Circle cx={108} cy={124} r={9} fill={veg.pea} />
              <Circle cx={130} cy={118} r={7.5} fill={veg.carrot} />
              <Circle cx={92} cy={140} r={6.5} fill={veg.beet} />
            </AnimatedG>
          </AnimatedG>
        </G>

        {/* Lid, rattling just above the rim. */}
        <AnimatedG originX={120} originY={70} animatedProps={lidProps}>
          <G fill="none" stroke={ink} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M62 66h76" />
            <Circle cx={100} cy={58} r={4.5} />
            <Path d="M100 62v4" />
          </G>
        </AnimatedG>

        {/* The pot itself: handles, body, gradient rim. */}
        <G fill="none" stroke={ink} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M46 88c-11 0-11 18 0 18" />
          <Path d="M154 88c11 0 11 18 0 18" />
          <Path d="M46 78h108l-9 58a15 15 0 0 1-15 13H70a15 15 0 0 1-15-13z" />
          <Path d="M36 76h128" stroke="url(#potRim)" strokeWidth={5.5} />
        </G>
      </Svg>
    </View>
  );
}
