import { Heart } from 'lucide-react-native';
import { Button } from 'tamagui';

interface FavoriteButtonProps {
  isFavorited: boolean;
  onPress: () => void;
  size?: number;
}

export function FavoriteButton({ isFavorited, onPress, size = 22 }: FavoriteButtonProps) {
  return (
    <Button circular chromeless onPress={onPress} accessibilityRole="button">
      <Heart
        size={size}
        color={isFavorited ? '#ef4444' : '#ffffff'}
        fill={isFavorited ? '#ef4444' : 'transparent'}
      />
    </Button>
  );
}
