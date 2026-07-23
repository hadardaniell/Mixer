import { Star } from 'lucide-react-native';
import { Button } from 'tamagui';

interface FavoriteButtonProps {
  isFavorited: boolean;
  onPress: () => void;
  size?: number;
  /** Drops the white circle behind the star — for use on a plain surface
   *  (e.g. the book header) rather than on top of a photo. */
  plain?: boolean;
}

export function FavoriteButton({
  isFavorited,
  onPress,
  size = 22,
  plain = false,
}: FavoriteButtonProps) {
  const color = '#F8C80E';
  const buttonSize = 38;
  const bg = plain ? 'transparent' : '#FFFFFF';
  return (
    <Button
      circular
      onPress={onPress}
      accessibilityRole="button"
      padding={0}
      height={buttonSize}
      minHeight={buttonSize}
      width={buttonSize}
      minWidth={buttonSize}
      backgroundColor={bg}
      opacity={1}
      hoverStyle={{ backgroundColor: bg, opacity: 1 }}
      pressStyle={{ backgroundColor: bg, opacity: plain ? 0.7 : 1 }}
    >
      <Star size={size} color={color} fill={isFavorited ? color : 'transparent'} />
    </Button>
  );
}
