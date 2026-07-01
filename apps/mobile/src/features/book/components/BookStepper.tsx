import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, XStack, YStack } from 'tamagui';

interface BookStepperProps {
  current: number;
  total: number;
}

/**
 * Header for the create-book wizard: the constant title and a row of numbered
 * dots — completed steps show a check, the current one is a filled orange dot,
 * upcoming ones are outlined. (No back control; exit via the nav bar.)
 */
export function BookStepper({ current, total }: BookStepperProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const onAccent = theme.textOnPrimary?.val as string;

  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <YStack gap="$2">
      <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
        {t('createBook.title')}
      </Text>

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
                backgroundColor={active ? '$accentLimeVivid' : '$surface'}
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
                  backgroundColor={n < current ? '$accentLimeVivid' : '$border'}
                />
              ) : null}
            </XStack>
          );
        })}
      </XStack>
    </YStack>
  );
}
