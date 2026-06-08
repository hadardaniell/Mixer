import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

interface IconChipProps {
  label: string;
  icon: React.ReactNode;
  /** Accent token for the icon blob, e.g. "$accentLavender". */
  accent: string;
  onPress?: () => void;
}

/**
 * Pill with a label and an icon sitting in a small accent blob — used for the
 * "supported sources" / "inspiration" rows on the create-recipe screens.
 * Generalizes the source-chip pattern from ImportRecipeCard.
 */
export function IconChip({ label, icon, accent, onPress }: IconChipProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <XStack
        alignItems="center"
        gap="$2"
        paddingVertical={8}
        paddingHorizontal={12}
        borderRadius={999}
        borderWidth={1}
        borderColor="$border"
        backgroundColor="$surface"
        pressStyle={onPress ? { backgroundColor: '$bgSubtle' } : undefined}
      >
        <Text fontSize={13} fontWeight="600" color="$text">
          {label}
        </Text>
        <YStack
          width={26}
          height={26}
          borderRadius={999}
          backgroundColor={accent}
          alignItems="center"
          justifyContent="center"
        >
          {icon}
        </YStack>
      </XStack>
    </Pressable>
  );
}
