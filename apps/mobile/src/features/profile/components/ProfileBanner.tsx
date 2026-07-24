import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { View } from 'tamagui';

/**
 * The soft gradient strip behind the profile header — a gentle periwinkle →
 * lilac wash that turns the screen from "a list" into "a page". Rendered with
 * react-native-svg (already a dependency) so it needs no gradient library, and
 * fades into the white canvas at the bottom so the avatar and content below sit
 * on white.
 */
export function ProfileBanner({ height = 132 }: { height?: number }) {
  return (
    <View position="absolute" top={0} left={0} right={0} height={height} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="pbTint" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E8EDFF" />
            <Stop offset="0.5" stopColor="#EFEAFF" />
            <Stop offset="1" stopColor="#FFEAF2" />
          </LinearGradient>
          {/* Vertical fade to white so the band dissolves into the canvas. */}
          <LinearGradient id="pbFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#pbTint)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#pbFade)" />
      </Svg>
    </View>
  );
}
