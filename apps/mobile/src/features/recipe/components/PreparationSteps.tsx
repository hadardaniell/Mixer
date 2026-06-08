import type { Recipe } from '@mixer/contracts';
import { Clock } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { formatDuration } from '@/shared/lib/formatDuration';
import { useIsRtl } from '@/shared/lib/useIsRtl';

interface PreparationStepsProps {
  steps: Recipe['steps'];
}

/** Cycled per-step number-badge accents — matches the design's varied blobs. */
const STEP_ACCENTS = ['$accentLavender', '$accentPeach', '$accentMint', '$accentPink'] as const;

/**
 * The "הוראות הכנה" section: numbered step cards with an optional per-step
 * time chip.
 */
export function PreparationSteps({ steps }: PreparationStepsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;

  const ordered = useMemo(() => [...steps].sort((a, b) => a.order - b.order), [steps]);

  if (ordered.length === 0) return null;

  return (
    <YStack gap="$2">
      <Text fontSize={17} fontWeight="700" color="$text" textAlign={isRtl ? 'right' : 'left'}>
        {t('recipe.preparation')}
      </Text>

      <YStack gap="$2">
        {ordered.map((step, index) => (
          <XStack
            key={step.order}
            backgroundColor="$surface"
            borderRadius={10}
            paddingHorizontal="$3"
            paddingVertical="$2"
            gap="$3"
            alignItems="center"
            minHeight={38}
            flexDirection="row"
            style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
            shadowColor="black"
            shadowOpacity={0.08}
            shadowRadius={18}
            shadowOffset={{ width: 0, height: 8 }}
            elevation={4}
          >
            <View
              width={32}
              height={32}
              borderRadius={999}
              backgroundColor={STEP_ACCENTS[index % STEP_ACCENTS.length]}
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={15} fontWeight="700" color="$text">
                {index + 1}
              </Text>
            </View>

            <Text
              flex={1}
              fontSize={13}
              color="$text"
              lineHeight={18}
              textAlign={isRtl ? 'right' : 'left'}
              numberOfLines={2}
            >
              {step.text}
            </Text>

            {step.durationMinutes ? (
              <XStack
                alignItems="center"
                gap={4}
                paddingHorizontal={8}
                paddingVertical={3}
                borderRadius={999}
                backgroundColor="$accentLavender"
                flexDirection="row"
                style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
              >
                <Clock size={12} color={ink} />
                <Text fontSize={11} fontWeight="600" color="$text">
                  {formatDuration(step.durationMinutes, t)}
                </Text>
              </XStack>
            ) : null}
          </XStack>
        ))}
      </YStack>
    </YStack>
  );
}
