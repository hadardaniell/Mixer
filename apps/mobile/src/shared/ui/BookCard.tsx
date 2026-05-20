import { Image } from 'react-native';
import { Text, YStack } from 'tamagui';

export interface BookCardData {
  id: string;
  name: string;
  coverUrl: string;
  recipeCount: number;
}

interface BookCardProps {
  book: BookCardData;
  onPress: () => void;
}

export function BookCard({ book, onPress }: BookCardProps) {
  return (
    <YStack
      onPress={onPress}
      width={160}
      height={200}
      borderRadius="$6"
      overflow="hidden"
      backgroundColor="$gray3"
      pressStyle={{ opacity: 0.9, scale: 0.98 }}
    >
      <Image source={{ uri: book.coverUrl }} style={{ position: 'absolute', inset: 0 }} />
      <YStack
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        padding="$3"
        gap="$1"
        backgroundColor="rgba(0,0,0,0.45)"
      >
        <Text color="white" fontSize="$4" fontWeight="600" numberOfLines={1}>
          {book.name}
        </Text>
        <Text color="white" fontSize="$2" opacity={0.85}>
          {book.recipeCount}
        </Text>
      </YStack>
    </YStack>
  );
}
