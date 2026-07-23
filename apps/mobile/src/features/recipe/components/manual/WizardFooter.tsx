import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

interface WizardFooterProps {
  backLabel: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  backDisabled?: boolean;
  nextDisabled?: boolean;
  /** Fill of the primary (next) button. Defaults to the app's ink primary. */
  nextColor?: string;
}

/**
 * Sticky two-button footer: an outlined "Back" on the start side and the violet
 * primary "Next"/"Save" on the end side (positions follow the app direction).
 */
export function WizardFooter({
  backLabel,
  nextLabel,
  onBack,
  onNext,
  backDisabled,
  nextDisabled,
  nextColor = '$buttonPrimaryBg',
}: WizardFooterProps) {
  const isRtl = useIsRtl();
  return (
    <XStack gap="$3" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
      <YStack flex={1}>
        <Pressable onPress={onBack} disabled={backDisabled} style={{ width: '100%' }}>
          <YStack
            width="100%"
            height={54}
            borderRadius={20}
            alignItems="center"
            justifyContent="center"
            backgroundColor="$surface"
            borderWidth={1}
            borderColor="$border"
            opacity={backDisabled ? 0.45 : 1}
            pressStyle={{ backgroundColor: '$bgSubtle' }}
          >
            <Text color="$textMuted" fontSize={18} fontWeight="700">
              {backLabel}
            </Text>
          </YStack>
        </Pressable>
      </YStack>
      <YStack flex={1}>
        <Pressable onPress={onNext} disabled={nextDisabled} style={{ width: '100%' }}>
          <YStack
            width="100%"
            height={54}
            borderRadius={20}
            alignItems="center"
            justifyContent="center"
            backgroundColor={nextColor}
            opacity={nextDisabled ? 0.5 : 1}
            shadowColor="black"
            shadowOpacity={0.28}
            shadowOffset={{ width: 0, height: 6 }}
            shadowRadius={14}
            elevation={10}
            pressStyle={{ opacity: 0.9 }}
          >
            <Text color="$buttonPrimaryText" fontSize={18} fontWeight="700">
              {nextLabel}
            </Text>
          </YStack>
        </Pressable>
      </YStack>
    </XStack>
  );
}
