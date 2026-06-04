import { Star } from 'lucide-react-native';
import { Button } from 'tamagui';

interface FavoriteButtonProps {
  isFavorited: boolean;
  onPress: () => void;
  size?: number;
}

export function FavoriteButton({ isFavorited, onPress, size = 22 }: FavoriteButtonProps) {
  const color = '#F8C80E';
  const buttonSize = 38;
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
      backgroundColor="#FFFFFF"
      opacity={1}
      hoverStyle={{ backgroundColor: '#FFFFFF', opacity: 1 }}
      pressStyle={{ backgroundColor: '#FFFFFF', opacity: 1 }}
    >
      <Star size={size} color={color} fill={isFavorited ? color : 'transparent'} />
    </Button>
  );
}
