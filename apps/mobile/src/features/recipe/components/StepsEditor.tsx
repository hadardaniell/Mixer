import { Plus, Trash2 } from 'lucide-react-native';
import type { Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import type { ManualForm, ManualFormAction, ManualStep } from '@/features/recipe/lib/manualRecipe';

import { STEP_BADGE_BG } from './PreparationSteps';
import { ManualTextInput } from './manual/ManualTextInput';

interface Props {
  form: ManualForm;
  dispatch: Dispatch<ManualFormAction>;
}

/**
 * Edit-mode twin of {@link PreparationSteps}: the same numbered "הוראות הכנה"
 * cards, but each step is a multiline input pre-filled with its text (plus an
 * optional minutes field), with per-step delete and an add button.
 */
export function StepsEditor({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const danger = theme.danger?.val as string;
  const primary = theme.primary?.val as string;

  const update = (index: number, patch: Partial<ManualStep>) => {
    const current = form.steps[index];
    if (!current) return;
    dispatch({ type: 'updateStep', index, value: { ...current, ...patch } });
  };

  const parseDuration = (raw: string): number | undefined => {
    const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  return (
    <YStack gap="$2" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
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
        {form.steps.map((s, index) => (
          <XStack
            key={index}
            backgroundColor="$surface"
            borderRadius={14}
            paddingHorizontal="$3"
            paddingVertical="$3"
            gap="$3"
            alignItems="flex-start"
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
              marginTop={4}
            >
              <Text fontSize={15} fontWeight="700" color="$textOnPrimary">
                {index + 1}
              </Text>
            </View>

            <YStack flex={1} gap="$2">
              <ManualTextInput
                value={s.text}
                onChangeText={(text) => update(index, { text })}
                placeholder={t('newRecipe.manual.step4.stepPlaceholder')}
                multiline
                style={{ minHeight: 72 }}
              />
              <ManualTextInput
                value={s.durationMinutes != null ? String(s.durationMinutes) : ''}
                onChangeText={(v) => update(index, { durationMinutes: parseDuration(v) })}
                placeholder={t('newRecipe.manual.step4.durationPlaceholder')}
                keyboardType="number-pad"
                style={{ width: 96, minHeight: 44 }}
              />
            </YStack>

            <Pressable
              hitSlop={8}
              onPress={() => dispatch({ type: 'removeStep', index })}
              accessibilityRole="button"
              style={{ marginTop: 6 }}
            >
              <Trash2 size={18} color={danger} />
            </Pressable>
          </XStack>
        ))}
      </YStack>

      <XStack
        onPress={() => dispatch({ type: 'addStep', value: { text: '' } })}
        alignItems="center"
        justifyContent="center"
        gap="$2"
        paddingVertical={12}
        borderRadius={14}
        backgroundColor="$accentLavender"
        pressStyle={{ opacity: 0.85 }}
      >
        <Plus size={18} color={primary} />
        <Text color="$primary" fontSize={15} fontWeight="700">
          {t('newRecipe.manual.step4.addStep')}
        </Text>
      </XStack>
    </YStack>
  );
}
