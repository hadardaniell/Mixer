import { ChefHat, Clock, Utensils } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import type { ManualForm } from '@/features/recipe/lib/manualRecipe';

import { StepShell } from './StepShell';

interface Props {
  form: ManualForm;
}

/** Step 5 — read-only summary of everything entered, with the autosave note. */
export function Step5Review({ form }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;

  const chips: { key: string; label: string; bg: string; Icon: typeof Clock }[] = [];
  if (form.prepTimeMinutes)
    chips.push({
      key: 'time',
      label: t('time.min', { count: form.prepTimeMinutes }),
      bg: '$accentLavender',
      Icon: Clock,
    });
  if (form.difficulty) {
    const diffLabel = { easy: 'diffEasy', medium: 'diffMedium', hard: 'diffHard' }[form.difficulty];
    chips.push({
      key: 'difficulty',
      label: t(`newRecipe.manual.step2.${diffLabel}`),
      bg: '$accentPink',
      Icon: ChefHat,
    });
  }
  if (form.servings)
    chips.push({
      key: 'servings',
      label: t('recipe.servingsTag', { count: form.servings }),
      bg: '$accentPeach',
      Icon: Utensils,
    });

  const ingredients = form.ingredients.filter((it) => it.name.trim());
  const steps = form.steps.filter((s) => s.text.trim());

  return (
    <StepShell step={5} title={t('newRecipe.manual.step5.title')}>
      <YStack gap="$4" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
        {form.coverImageUrl ? (
          <Image
            source={{ uri: form.coverImageUrl }}
            style={{ width: '100%', height: 200, borderRadius: 18 }}
            resizeMode="cover"
          />
        ) : null}

        <YStack gap="$2" alignItems="center">
          <Text color="$text" fontSize={20} fontWeight="700" textAlign="center">
            {form.title.trim()}
          </Text>
          {form.description.trim() ? (
            <Text color="$textMuted" fontSize={14} textAlign="center">
              {form.description.trim()}
            </Text>
          ) : null}
        </YStack>

        {chips.length > 0 ? (
          <XStack flexWrap="wrap" justifyContent="center" gap="$2">
            {chips.map(({ key, label, bg, Icon }) => (
              <XStack
                key={key}
                alignItems="center"
                gap={6}
                paddingHorizontal={12}
                paddingVertical={8}
                borderRadius={14}
                backgroundColor={bg}
              >
                <Icon size={16} color={ink} />
                <Text fontSize={13} fontWeight="600" color="$text">
                  {label}
                </Text>
              </XStack>
            ))}
          </XStack>
        ) : null}

        {ingredients.length > 0 ? (
          <YStack gap="$2">
            <Text color="$text" fontSize={16} fontWeight="700">
              {t('newRecipe.manual.step5.ingredientsHeading')}
            </Text>
            {ingredients.map((it, i) => (
              <Text key={i} color="$text" fontSize={14}>
                • {[it.amount, it.unit, it.name].filter((v) => v != null && v !== '').join(' ')}
              </Text>
            ))}
          </YStack>
        ) : null}

        {steps.length > 0 ? (
          <YStack gap="$2">
            <Text color="$text" fontSize={16} fontWeight="700">
              {t('newRecipe.manual.step5.stepsHeading')}
            </Text>
            {steps.map((s, i) => (
              <XStack key={i} gap="$2" alignItems="center">
                <YStack
                  width={20}
                  height={20}
                  borderRadius={999}
                  backgroundColor="$primary"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={11} fontWeight="600" color="$textOnPrimary">
                    {i + 1}
                  </Text>
                </YStack>
                <Text flex={1} color="$text" fontSize={14}>
                  {s.text}
                </Text>
              </XStack>
            ))}
          </YStack>
        ) : null}

        <XStack alignItems="center" justifyContent="center" gap="$2" marginTop="$1">
          <YStack width={8} height={8} borderRadius={999} backgroundColor="$success" />
          <Text color="$textMuted" fontSize={13}>
            {t('newRecipe.manual.step5.autosaveNote')}
          </Text>
        </XStack>
      </YStack>
    </StepShell>
  );
}
