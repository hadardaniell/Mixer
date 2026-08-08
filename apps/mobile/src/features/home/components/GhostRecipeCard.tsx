import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { useTheme } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import { BLOB_PATHS } from '@/shared/ui/BlobShape';

/**
 * The outline of a recipe card that isn't there yet — the empty-feed illustration.
 *
 * It deliberately traces the real `RecipeCard`: same 8px corner, the image block on
 * top, the time chip over its start corner, the favorite star straddling the image
 * edge, title and category bars below. Dashed where the card's own boundary would
 * be, solid ink for the drawn details — so it reads as "your first recipe lands
 * here" rather than as a broken card.
 *
 * Fully still, unlike `MixerBowl`: the home CTA right above already has a stirring
 * bowl, and two loops on one screen compete. Even the blob is painted into this Svg
 * instead of stacking an animated `BlobShape` behind it.
 *
 * `react-native-svg` can't read Tamagui tokens, so — like `BlobShape` — colors are
 * resolved here before being handed over as hex.
 */

const VB_W = 132;
const VB_H = 142;

interface GhostRecipeCardProps {
  /** Rendered width in px. Height derives from the drawing's aspect ratio. */
  size?: number;
}

export function GhostRecipeCard({ size = 132 }: GhostRecipeCardProps) {
  const theme = useTheme();
  const isRtl = useIsRtl();
  const height = (size * VB_H) / VB_W;

  const ink = theme.text?.val as string;
  const imageFill = theme.bgSubtle?.val as string;
  const blobFill = theme.accentLavender?.val as string;
  const chipFill = theme.tintPeriwinkle?.val as string;

  return (
    <Svg width={size} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      {/* Blob peeking past the card's lower-trailing corner, at the same 0.72 the
          conceptual icons use so the ink lines stay legible over it. */}
      <G
        opacity={0.72}
        transform={isRtl ? 'translate(-4 84) scale(0.52)' : 'translate(64 84) scale(0.52)'}
      >
        <Path d={BLOB_PATHS[1]} fill={blobFill} />
      </G>

      {/* The card's own boundary — dashed, because it's the part that doesn't exist yet. */}
      <Rect
        x={16}
        y={6}
        width={100}
        height={118}
        rx={8}
        fill="none"
        stroke={ink}
        strokeWidth={1.8}
        strokeDasharray="6 6"
        opacity={0.55}
      />

      {/* Image block, with the photo glyph the real card would cover up. */}
      <Rect x={24} y={14} width={84} height={58} rx={5} fill={imageFill} />
      <G
        fill="none"
        stroke={ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.45}
      >
        <Path d="M56 56l11-12 8 9 6-6 9 9" />
        <Circle cx={57} cy={32} r={3.4} />
      </G>

      {/* Time chip, over the image's start corner exactly like RecipeCard. */}
      <Rect x={isRtl ? 76 : 30} y={20} width={26} height={11} rx={5.5} fill={chipFill} />

      {/* Favorite star, straddling the image's bottom edge. */}
      <Circle
        cx={isRtl ? 98 : 34}
        cy={72}
        r={9}
        fill={imageFill}
        stroke={ink}
        strokeWidth={1.8}
        opacity={0.55}
      />

      {/* Title and category lines, starting from the card's start edge in both
          directions (RTL flips to the right inset — 108 is the card's inner end). */}
      <Rect x={isRtl ? 50 : 24} y={86} width={58} height={7} rx={3.5} fill={ink} opacity={0.16} />
      <Rect x={isRtl ? 70 : 24} y={100} width={38} height={6} rx={3} fill={ink} opacity={0.1} />
    </Svg>
  );
}
