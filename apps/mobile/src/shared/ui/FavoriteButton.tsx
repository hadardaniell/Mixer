import { Star } from 'lucide-react-native';
import { Button } from 'tamagui';

interface FavoriteButtonProps {
  isFavorited: boolean;
  onPress: () => void;
  size?: number;
}

export function FavoriteButton({ isFavorited, onPress, size = 22 }: FavoriteButtonProps) {
  const color = '#F8C80E';
  return (
    <Button
      circular
      chromeless
      onPress={onPress}
      accessibilityRole="button"
      padding={0}
      height={size + 8}
      width={size + 8}
    >
      <Star size={size} color={color} fill={isFavorited ? color : 'transparent'} />
    </Button>
  );
}
