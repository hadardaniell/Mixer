import { Pressable } from 'react-native';
import { Text, YStack } from 'tamagui';

interface AuthPrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Violet primary button — used across the auth screens (login, register steps).
 * Radius 20, soft violet shadow; dims to 0.55 when disabled.
 */
export function AuthPrimaryButton({ label, onPress, disabled }: AuthPrimaryButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ width: '100%' }}>
      <YStack
        width="100%"
        height={54}
        borderRadius={20}
        alignItems="center"
        justifyContent="center"
        backgroundColor="$buttonPrimaryBg"
        opacity={disabled ? 0.55 : 1}
        shadowColor="$primary"
        shadowOpacity={0.35}
        shadowOffset={{ width: 0, height: 8 }}
        shadowRadius={16}
        elevation={6}
        pressStyle={{ backgroundColor: '$buttonPrimaryBgHover' }}
      >
        <Text color="$textOnPrimary" fontSize={18} fontWeight="700">
          {label}
        </Text>
      </YStack>
    </Pressable>
  );
}
