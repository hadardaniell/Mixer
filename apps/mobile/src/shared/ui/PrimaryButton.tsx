import { Pressable } from 'react-native';
import { Spinner, Text, YStack } from 'tamagui';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Shows a spinner and the label side by side; also disables the press. */
  loading?: boolean;
}

/**
 * The one primary action button — save, confirm, accept, create, sign-in.
 *
 * Ink fill with a white label: "black = action" across the whole app, the same
 * language as the ink discs (FAB, quick actions, back). Periwinkle is the brand
 * accent for chips, active states and links, and is deliberately **not** a
 * button fill — a light-tint button and an ink button side by side read as two
 * different products.
 *
 * Every large primary button routes through here so there is exactly one look
 * to maintain. Don't re-inline an ink button; import this.
 */
export function PrimaryButton({ label, onPress, disabled, loading }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={{ width: '100%' }}>
      <YStack
        width="100%"
        height={54}
        borderRadius={20}
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        gap="$2"
        backgroundColor="$buttonPrimaryBg"
        opacity={isDisabled ? 0.5 : 1}
        shadowColor="black"
        shadowOpacity={0.28}
        shadowRadius={14}
        shadowOffset={{ width: 0, height: 6 }}
        elevation={10}
        pressStyle={{ backgroundColor: '$buttonPrimaryBgHover' }}
      >
        {loading ? <Spinner size="small" color="$buttonPrimaryText" /> : null}
        <Text color="$buttonPrimaryText" fontSize={18} fontWeight="700">
          {label}
        </Text>
      </YStack>
    </Pressable>
  );
}
