import { Text, XStack } from 'tamagui';

interface CategoryChipProps {
  label: string;
  onPress: () => void;
}

/** Pill chip: soft lavender fill, no border. */
export function CategoryChip({ label, onPress }: CategoryChipProps) {
  return (
    <XStack
      onPress={onPress}
      paddingHorizontal={16}
      paddingVertical={10}
      borderRadius={999}
      backgroundColor="$categoryChipBg"
      alignItems="center"
      justifyContent="center"
      pressStyle={{ opacity: 0.85, scale: 0.97 }}
    >
      <Text color="$categoryChipText" fontSize={14} fontWeight="600">
        {label}
      </Text>
    </XStack>
  );
}
