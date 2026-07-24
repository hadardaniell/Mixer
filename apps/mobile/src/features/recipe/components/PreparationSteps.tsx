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

/**
 * The step-number badge fill — one tint for every step, not a cycle.
 *
 * A rotating ramp was tried and dropped: the number already encodes the
 * sequence, so the color carried no information, and four pale tints down a
 * column read as inconsistency rather than rhythm. Uniform badges let the eye
 * find "where was I" by position and numeral alone.
 *
 * Exported so the manual wizard's step editor matches exactly.
 */
export const STEP_BADGE_BG = '$tintPeriwinkle';

/**
 * The "הוראות הכנה" section: numbered step cards with an optional per-step
 * time chip.
 */
export function PreparationSteps({ steps }: PreparationStepsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const muted = theme.textMuted?.val as string;

  const ordered = useMemo(() => [...steps].sort((a, b) => a.order - b.order), [steps]);

  if (ordered.length === 0) return null;

  return (
    <YStack gap="$2">
      <Text
        fontSize={20}
        fontWeight="700"
        letterSpacing={-0.6}
        color="$text"
        textAlign={isRtl ? 'right' : 'left'}
      >
        {t('recipe.preparation')}
      </Text>

      <YStack gap="$2">
        {ordered.map((step, index) => (
          <XStack
            key={step.order}
            backgroundColor="$surface"
            borderRadius={14}
            paddingHorizontal="$3"
            paddingVertical="$3"
            gap="$3"
            alignItems="flex-start"
            minHeight={38}
            flexDirection="row"
            style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
            shadowColor="black"
            shadowOpacity={0.24}
            shadowRadius={12}
            shadowOffset={{ width: 0, height: 5 }}
            elevation={9}
          >
            <View
              width={32}
              height={32}
              borderRadius={999}
              backgroundColor={STEP_BADGE_BG}
              alignItems="center"
              justifyContent="center"
            >
              {/* Deep brand blue, not `$text`. Near-black on a saturated tint
                  muddies; this keeps the numeral crisp on all four steps. */}
              <Text fontSize={15} fontWeight="700" color="$textOnPrimary">
                {index + 1}
              </Text>
            </View>

            {/* No `numberOfLines` cap. A long preparation step was previously
                truncated at two lines with no way to expand it, which silently
                lost instructions the cook actually needs. */}
            <Text
              flex={1}
              fontSize={14}
              color="$text"
              lineHeight={21}
              textAlign={isRtl ? 'right' : 'left'}
              paddingTop={5}
            >
              {step.text}
            </Text>

            {/* Neutral grey, not a hue. This chip repeats on every step — six
                colored pills down a column is a lot of color for a label that
                only ever says the same kind of thing. The meta chips at the top
                of the screen summarise once and can afford a hue; this one
                can't. */}
            {step.durationMinutes ? (
              <XStack
                alignItems="center"
                gap={4}
                marginTop={4}
                paddingHorizontal={8}
                paddingVertical={3}
                borderRadius={999}
                backgroundColor="$bgSubtle"
                flexDirection="row"
                style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
              >
                <Clock size={12} color={muted} />
                <Text fontSize={11} fontWeight="700" color="$textMuted">
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
