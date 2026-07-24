import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { useTheme, View, YStack } from 'tamagui';

import { MixerBowl } from '@/shared/ui/MixerBowl';

/**
 * The Start hero, animated: four social-network glyphs fall one after another
 * into the mixer bowl, the whisk stirs, colored sparks pop, and a recipe card
 * rises out — then it loops. Straight off the concept: "social clips go in, a
 * recipe comes out."
 *
 * A single master clock (`m`, 0→1 over one cycle) drives every element, so the
 * drops, the sparks and the rise stay in phase no matter how many loops run.
 * Built from Reanimated + SVG — no video, no Lottie — and it collapses to a
 * still composition under reduce-motion.
 */

const STAGE_H = 330;
const BOWL = 168;
const ICON = 34;

// translateY (from the icon's top:6 origin) where a glyph reaches the bowl rim,
// and where it finishes sinking into the mix.
const RIM_TY = 223;
const SINK_TY = 248;

const CYCLE_MS = 4600;

// One glyph's fall+sink occupies this slice of the cycle.
const DROP_WINDOW = 0.52;

// startX = the spread across the top before each glyph funnels to center;
// phase = where in the cycle its fall begins (staggered, like the artifact).
const DROPS = [
  { startX: -84, phase: 0.0 },
  { startX: -28, phase: 0.098 },
  { startX: 28, phase: 0.196 },
  { startX: 84, phase: 0.293 },
] as const;

export function StartMixerScene() {
  const reduceMotion = useReducedMotion();
  const m = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    m.value = withRepeat(withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }), -1, false);
  }, [reduceMotion, m]);

  if (reduceMotion) return <StaticScene />;

  return (
    <View width="100%" height={STAGE_H} alignItems="center" justifyContent="flex-end">
      {/* Falling glyphs */}
      <DropIcon m={m} startX={DROPS[0].startX} phase={DROPS[0].phase} kind="instagram" />
      <DropIcon m={m} startX={DROPS[1].startX} phase={DROPS[1].phase} kind="tiktok" />
      <DropIcon m={m} startX={DROPS[2].startX} phase={DROPS[2].phase} kind="youtube" />
      <DropIcon m={m} startX={DROPS[3].startX} phase={DROPS[3].phase} kind="facebook" />

      {/* Sparks that pop while it mixes */}
      <Sparks m={m} />

      {/* The recipe that emerges */}
      <RiseRecipe m={m} />

      {/* The bowl, anchored at the bottom, whisk stirring */}
      <View position="absolute" bottom={6}>
        <MixerBowl size={BOWL} animated />
      </View>
    </View>
  );
}

/** Reduce-motion fallback: the bowl with a recipe card resting above it. */
function StaticScene() {
  return (
    <View width="100%" height={STAGE_H} alignItems="center" justifyContent="flex-end">
      <View position="absolute" top={60}>
        <RecipeCardArt />
      </View>
      <View position="absolute" bottom={6}>
        <MixerBowl size={BOWL} />
      </View>
    </View>
  );
}

function DropIcon({
  m,
  startX,
  phase,
  kind,
}: {
  m: SharedValue<number>;
  startX: number;
  phase: number;
  kind: SocialKind;
}) {
  const style = useAnimatedStyle(() => {
    'worklet';
    const raw = (m.value - phase) / DROP_WINDOW;
    if (raw < 0) return { opacity: 0 };
    const u = Math.min(raw, 1);

    // Fall for the first ~77% of the window, then sink into the mix.
    const fall = Math.min(u / 0.77, 1);
    // Accelerating fall (gravity) and a funnel that holds wide, then rushes to
    // centre near the rim — matching the drop in the design source.
    let ty = RIM_TY * Math.pow(fall, 1.7);
    let tx = startX * (1 - fall * fall);
    let sc = 1;
    let op = u < 0.08 ? u / 0.08 : 1;
    const rot = -8 + fall * 14;

    if (u > 0.77) {
      const s = (u - 0.77) / 0.23;
      ty = RIM_TY + s * (SINK_TY - RIM_TY);
      tx = 0;
      sc = 1 - 0.78 * s;
      op = 1 - s;
    }

    return {
      opacity: op,
      transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }, { rotate: `${rot}deg` }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 6, width: ICON, height: ICON }, style]}
    >
      <SocialGlyph kind={kind} />
    </Animated.View>
  );
}

const SPARKS = [
  { dx: -48, dy: 58, color: 'accentBowlRim' },
  { dx: 50, dy: 54, color: 'primary' },
  { dx: -30, dy: 74, color: 'accentYellow' },
  { dx: 40, dy: 74, color: 'accentPurple' },
  { dx: 2, dy: 86, color: 'accentGreen' },
  { dx: -64, dy: 34, color: 'primary' },
] as const;

function Sparks({ m }: { m: SharedValue<number> }) {
  return (
    <View position="absolute" top={242} width={1} height={1} alignItems="center">
      {SPARKS.map((s, i) => (
        <Spark key={i} m={m} dx={s.dx} dy={s.dy} colorKey={s.color} index={i} />
      ))}
    </View>
  );
}

function Spark({
  m,
  dx,
  dy,
  colorKey,
  index,
}: {
  m: SharedValue<number>;
  dx: number;
  dy: number;
  colorKey: string;
  index: number;
}) {
  const theme = useTheme();
  const color = (theme as Record<string, { val: string } | undefined>)[colorKey]?.val as string;
  const start = 0.42 + index * 0.01;

  const style = useAnimatedStyle(() => {
    'worklet';
    const raw = (m.value - start) / 0.24;
    if (raw < 0 || raw > 1) return { opacity: 0 };
    const op = Math.sin(raw * Math.PI) * 0.9;
    return {
      opacity: op,
      transform: [{ translateX: dx * raw }, { translateY: -dy * raw }, { scale: 0.5 + raw * 0.6 }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: 8, height: 8, borderRadius: 999, backgroundColor: color },
        style,
      ]}
    />
  );
}

function RiseRecipe({ m }: { m: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    'worklet';
    const raw = (m.value - 0.6) / 0.4;
    if (raw < 0) return { opacity: 0 };
    const rr = Math.min(raw, 1);

    let op: number;
    let ty: number;
    let sc: number;
    if (rr < 0.3) {
      const s = rr / 0.3;
      op = s;
      ty = 120 * (1 - s);
      sc = 0.6 + 0.4 * s;
    } else if (rr < 0.85) {
      op = 1;
      ty = 0;
      sc = 1;
    } else {
      const s = (rr - 0.85) / 0.15;
      op = 1 - s;
      ty = -10 * s;
      sc = 1 - 0.05 * s;
    }

    return { opacity: op, transform: [{ translateY: ty }, { scale: sc }] };
  });

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 60 }, style]}>
      <RecipeCardArt />
    </Animated.View>
  );
}

/** A textless recipe card — photo placeholder + star + two skeleton bars. The
 *  shape reads as "a recipe" without inventing fake content or copy. */
function RecipeCardArt() {
  return (
    <YStack
      width={118}
      height={116}
      borderRadius={14}
      backgroundColor="$surface"
      overflow="hidden"
      shadowColor="black"
      shadowOpacity={0.2}
      shadowRadius={16}
      shadowOffset={{ width: 0, height: 10 }}
      elevation={8}
    >
      <View flex={1} backgroundColor="$bgSubtle" alignItems="flex-start" padding={8}>
        <View
          width={22}
          height={22}
          borderRadius={999}
          backgroundColor="$surface"
          alignItems="center"
          justifyContent="center"
        >
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path
              d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.8l-5.8 3.05 1.1-6.45-4.7-4.6 6.5-.95z"
              fill="#F8C80E"
            />
          </Svg>
        </View>
      </View>
      <View padding={10} gap={6}>
        <View height={7} width="80%" borderRadius={999} backgroundColor="$borderStrong" />
        <View height={6} width="45%" borderRadius={999} backgroundColor="$border" />
      </View>
    </YStack>
  );
}

// ── Social glyphs — outlined line-art in each brand's color, no chip ─────────

type SocialKind = 'instagram' | 'tiktok' | 'youtube' | 'facebook';

function SocialGlyph({ kind }: { kind: SocialKind }) {
  const theme = useTheme();
  const ink = theme.text?.val as string;
  const stroke = {
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  if (kind === 'instagram') {
    return (
      <Svg width={ICON} height={ICON} viewBox="0 0 24 24">
        <G stroke="#E1306C" {...stroke}>
          <Rect x={3.5} y={3.5} width={17} height={17} rx={5} />
          <Circle cx={12} cy={12} r={4} />
        </G>
        <Circle cx={17} cy={7} r={1.2} fill="#E1306C" />
      </Svg>
    );
  }
  if (kind === 'tiktok') {
    // Black in the brand — resolve to theme ink so it survives dark mode.
    return (
      <Svg width={ICON} height={ICON} viewBox="0 0 24 24">
        <G stroke={ink} {...stroke}>
          <Path d="M13 4v10.6a3.6 3.6 0 1 1-3.6-3.6" />
          <Path d="M13 4.2c.4 2.3 2 3.8 4.3 4" />
        </G>
      </Svg>
    );
  }
  if (kind === 'youtube') {
    return (
      <Svg width={ICON} height={ICON} viewBox="0 0 24 24">
        <G stroke="#FF0000" {...stroke}>
          <Rect x={2.5} y={6} width={19} height={12} rx={4} />
          <Path d="M10.4 9.4v5.2l4.4-2.6-4.4-2.6Z" />
        </G>
      </Svg>
    );
  }
  return (
    <Svg width={ICON} height={ICON} viewBox="0 0 24 24">
      <G stroke="#1877F2" {...stroke}>
        <Path d="M15 4.5h-1.7C11.8 4.5 11 5.6 11 7.3V20" />
        <Path d="M8.4 11h5.6" />
      </G>
    </Svg>
  );
}
