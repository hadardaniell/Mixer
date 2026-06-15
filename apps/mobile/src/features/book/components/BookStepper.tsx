import { Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

interface BookStepperProps {
  current: number;
  total: number;
  onBack: () => void;
}

/**
 * Header for the create-book wizard: a back chevron, the constant title, and a
 * row of numbered dots — completed steps show a check, the current one is a
 * filled orange dot, upcoming ones are outlined.
 */
export function BookStepper({ current, total, onBack }: BookStepperProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;
  const onAccent = theme.textOnPrimary?.val as string;
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <YStack gap="$2">
      <XStack width="100%" alignItems="center" justifyContent="center" zIndex={1}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          hitSlop={12}
          style={{ position: 'absolute', start: 0, padding: 4 } as never}
        >
          <BackIcon size={26} color={ink} />
        </Pressable>
        <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
          {t('createBook.title')}
        </Text>
      </XStack>

      <XStack alignItems="center" paddingHorizontal="$3" marginTop="$2">
        {steps.map((n) => {
          const isDone = n < current;
          const isCurrent = n === current;
          const active = isDone || isCurrent;
          return (
            <XStack key={n} alignItems="center" flex={n === total ? 0 : 1}>
              <YStack
                width={34}
                height={34}
                borderRadius={999}
                alignItems="center"
                justifyContent="center"
                backgroundColor={active ? '$accentOrange' : '$surface'}
                borderWidth={active ? 0 : 1}
                borderColor="$border"
              >
                {isDone ? (
                  <Check size={18} color={onAccent} strokeWidth={3} />
                ) : (
                  <Text fontSize={14} fontWeight="600" color={isCurrent ? onAccent : '$textMuted'}>
                    {n}
                  </Text>
                )}
              </YStack>
              {n !== total ? (
                <YStack
                  flex={1}
                  height={2}
                  backgroundColor={n < current ? '$accentOrange' : '$border'}
                />
              ) : null}
            </XStack>
          );
        })}
      </XStack>
    </YStack>
  );
}
