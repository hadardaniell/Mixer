import type { ComponentType } from 'react';
import { useTheme, View } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import { BlobShape } from '@/shared/ui/BlobShape';

/**
 * Accepts either library's icon. lucide and phosphor declare incompatible
 * `propTypes` (lucide's `color` is RN's `ColorValue`, phosphor's is `string`),
 * so a structural props type can't cover both. This component only ever passes
 * `size` and `color`, which both accept, so `ComponentType<any>` is the honest
 * type — the render call below is the real contract.
 */
type AnyIcon = ComponentType<any>;

interface ConceptualIconProps {
  Icon: AnyIcon;
  /** Theme alias for the blob tint, e.g. `$accentPink`. */
  blobColor: string;
  /** Selects the blob silhouette so a set never looks stamped. */
  variant?: number;
  /** Nominal box size. Icon and blob scale from this. */
  size?: number;
}

/**
 * The project's conceptual-icon look, straight off the mood board: a black
 * **line-art** glyph sitting on the canvas with a soft colored blob peeking out
 * from behind its lower-trailing corner. No disc, no fill — the icon is hollow
 * strokes, the blob is the only color, and the two overlap so it reads as one
 * drawn mark rather than an icon-in-a-button.
 *
 * This is deliberately NOT the ink disc (`BlobActionCard`). The disc is a hard,
 * solid action affordance; the conceptual icon is a soft, illustrative label.
 * Use this for menu rows, empty states, feature markers — anywhere the mood
 * board would have drawn a little scene.
 */
export function ConceptualIcon({ Icon, blobColor, variant = 0, size = 48 }: ConceptualIconProps) {
  const theme = useTheme();
  const isRtl = useIsRtl();
  const blob = size * 0.5;
  const glyph = size * 0.66;

  return (
    <View width={size} height={size} alignItems="center" justifyContent="center">
      {/* Blob behind the lower-trailing corner, at reduced opacity so the black
          line glyph stays legible where the two overlap — at full opacity the
          fill swallows the icon. `end`/`start` don't resolve for absolute
          positioning in Tamagui, so the side is picked from direction. */}
      <View
        position="absolute"
        opacity={0.72}
        bottom={0}
        left={isRtl ? -size * 0.1 : undefined}
        right={isRtl ? undefined : -size * 0.1}
      >
        <BlobShape size={blob} color={blobColor} variant={variant} />
      </View>

      <Icon size={glyph} color={theme.text?.val as string} />
    </View>
  );
}
