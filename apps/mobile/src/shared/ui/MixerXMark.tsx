import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'tamagui';

import { MIXER_X_PATH, MIXER_X_VIEWBOX as VB } from './mixerXPath';

interface MixerXMarkProps {
  /** Rendered size in px (the mark is drawn square-ish; height follows its ratio). */
  size?: number;
  /** Theme alias (`$text`, `$primary`, …) or a raw hex. Defaults to the ink. */
  color?: string;
}

/**
 * The Mixer x, as an icon. This is the app signing its name — use it where the
 * product identifies itself in a small square (the "recipe is ready" banner), not as
 * decoration inside a screen. For that, the mixer bowl or a `ConceptualIcon` is the
 * right mark.
 *
 * `react-native-svg` can't read Tamagui tokens, so the alias is resolved here.
 */
export function MixerXMark({ size = 24, color = '$text' }: MixerXMarkProps) {
  const theme = useTheme();
  const key = color.startsWith('$') ? color.slice(1) : color;
  const fill = color.startsWith('#')
    ? color
    : ((theme as Record<string, { val: string } | undefined>)[key]?.val ?? color);
  const height = (size * VB.height) / VB.width;

  return (
    <Svg width={size} height={height} viewBox={`${VB.x} ${VB.y} ${VB.width} ${VB.height}`}>
      <Path d={MIXER_X_PATH} fill={fill} />
    </Svg>
  );
}
