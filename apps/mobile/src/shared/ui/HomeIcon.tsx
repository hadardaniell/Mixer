import Svg, { Path } from 'react-native-svg';

interface HomeIconProps {
  size?: number;
  color: string;
  /** Filled (active) renders a solid house with the door as a cutout notch —
   *  the bar shows through it, Instagram-style. Otherwise it's outlined. */
  filled?: boolean;
}

// Single silhouette path that routes around the door, so the door stays open
// (a notch) whether the shape is filled or just stroked.
const HOUSE =
  'M12 2 L21 9 V20 A2 2 0 0 1 19 22 H15 V12 H9 V22 H5 A2 2 0 0 1 3 20 V9 Z';

export function HomeIcon({ size = 24, color, filled }: HomeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={HOUSE}
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={filled ? 0 : 2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
