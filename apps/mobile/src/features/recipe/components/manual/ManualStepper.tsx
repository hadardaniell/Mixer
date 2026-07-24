import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

interface ManualStepperProps {
  current: number;
  total: number;
  onBack: () => void;
  /** Edit mode swaps the "יצירת" title for "עריכת". */
  isEdit?: boolean;
}

/**
 * The create-flow header for the manual wizard: a back chevron, the
 * "יצירת/עריכת מתכון ידני" title, a "step X of Y" line, and a row of numbered
 * dots with a progress connector.
 */
export function ManualStepper({ current, total, onBack, isEdit = false }: ManualStepperProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <YStack gap="$2">
      <XStack width="100%" justifyContent="flex-start">
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={8}>
          <BackIcon size={28} color={ink} />
        </Pressable>
      </XStack>

      <YStack alignItems="center" gap="$1" marginTop={-16}>
        <Text color="$text" fontSize={26} fontWeight="700" letterSpacing={-0.5} textAlign="center">
          {t(isEdit ? 'newRecipe.manual.editTitle' : 'newRecipe.manual.title')}
        </Text>
        <Text color="$textMuted" fontSize={15} textAlign="center">
          {t('newRecipe.manual.stepOf', { current, total })}
        </Text>
      </YStack>

      {/* Numbered dots + connectors */}
      <XStack alignItems="center" paddingHorizontal="$2" marginTop="$2">
        {steps.map((n) => {
          const isCurrent = n === current;
          const isDone = n < current;
          // Three states: current = bright periwinkle `$primary` #6C8EFF + white
          // numeral (the focal point); done = soft periwinkle fill + brand-blue
          // numeral; upcoming = white with a hairline.
          const bg = isCurrent ? '$primary' : isDone ? '$primarySubtle' : '$surface';
          const numColor = isCurrent ? '#FFFFFF' : isDone ? '$textOnPrimary' : '$textMuted';
          return (
            <XStack key={n} alignItems="center" flex={n === total ? 0 : 1}>
              <YStack
                width={36}
                height={36}
                borderRadius={999}
                alignItems="center"
                justifyContent="center"
                backgroundColor={bg}
                borderWidth={isCurrent || isDone ? 0 : 1}
                borderColor="$border"
              >
                <Text fontSize={14} fontWeight="700" color={numColor}>
                  {n}
                </Text>
              </YStack>
              {n !== total ? (
                <YStack
                  flex={1}
                  height={2}
                  backgroundColor={n < current ? '$primary' : '$border'}
                />
              ) : null}
            </XStack>
          );
        })}
      </XStack>
    </YStack>
  );
}
