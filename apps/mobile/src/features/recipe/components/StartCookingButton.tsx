import { ChefHat } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { Text, useTheme, XStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

interface StartCookingButtonProps {
  label: string;
  onPress: () => void;
}

/**
 * The big "התחלת בישול" CTA. Lime (secondary/action) fill with dark ink —
 * the cooking-flow affordance, distinct from the violet primary buttons.
 */
export function StartCookingButton({ label, onPress }: StartCookingButtonProps) {
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.textOnSecondary?.val as string;

  return (
    <Pressable onPress={onPress} style={{ width: '100%' }}>
      <XStack
        width="100%"
        height={48}
        borderRadius={20}
        alignItems="center"
        justifyContent="center"
        gap="$2"
        backgroundColor="$buttonSecondaryBg"
        shadowColor="$secondary"
        shadowOpacity={0.3}
        shadowOffset={{ width: 0, height: 8 }}
        shadowRadius={16}
        elevation={5}
        pressStyle={{ backgroundColor: '$buttonSecondaryBgHover' }}
        style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
      >
        <ChefHat size={22} color={ink} />
        <Text color="$textOnSecondary" fontSize={18} fontWeight="700">
          {label}
        </Text>
      </XStack>
    </Pressable>
  );
}
