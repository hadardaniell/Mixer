import { Clock, Plus, Trash2 } from 'lucide-react-native';
import { type Dispatch, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import type { ManualForm, ManualFormAction, ManualStep } from '@/features/recipe/lib/manualRecipe';
import { STEP_ACCENTS } from '@/features/recipe/components/PreparationSteps';

import { ManualTextInput } from './ManualTextInput';
import { StepShell } from './StepShell';

interface Props {
  form: ManualForm;
  dispatch: Dispatch<ManualFormAction>;
}

/** Step 4 — preparation steps, each with text and an optional duration. */
export function Step4Steps({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const danger = theme.danger?.val as string;
  const ink = theme.text?.val as string;

  const [text, setText] = useState('');
  const [duration, setDuration] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const reset = () => {
    setText('');
    setDuration('');
    setEditingIndex(null);
  };

  const commit = () => {
    if (!text.trim()) return;
    const mins = parseInt(duration.replace(/[^0-9]/g, ''), 10);
    const value: ManualStep = {
      text: text.trim(),
      durationMinutes: Number.isFinite(mins) && mins > 0 ? mins : undefined,
    };
    if (editingIndex == null) dispatch({ type: 'addStep', value });
    else dispatch({ type: 'updateStep', index: editingIndex, value });
    reset();
  };

  const edit = (index: number) => {
    const s = form.steps[index];
    if (!s) return;
    setText(s.text);
    setDuration(s.durationMinutes != null ? String(s.durationMinutes) : '');
    setEditingIndex(index);
  };

  return (
    <StepShell step={4} title={t('newRecipe.manual.step4.title')}>
      <YStack gap="$3" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
        <ManualTextInput
          value={text}
          onChangeText={setText}
          placeholder={t('newRecipe.manual.step4.stepPlaceholder')}
          multiline
        />
        <XStack gap="$2" alignItems="center">
          <ManualTextInput
            value={duration}
            onChangeText={setDuration}
            placeholder={t('newRecipe.manual.step4.durationPlaceholder')}
            keyboardType="number-pad"
            style={{ width: 96, minHeight: 44 }}
          />
          <XStack
            flex={1}
            onPress={commit}
            alignItems="center"
            justifyContent="center"
            gap="$2"
            paddingVertical={12}
            borderRadius={14}
            backgroundColor="$accentLavender"
            opacity={text.trim() ? 1 : 0.5}
            pressStyle={{ opacity: 0.85 }}
          >
            <Plus size={18} color={theme.primary?.val as string} />
            <Text color="$primary" fontSize={15} fontWeight="700">
              {editingIndex == null
                ? t('newRecipe.manual.step4.addStep')
                : t('newRecipe.manual.step4.updateStep')}
            </Text>
          </XStack>
        </XStack>

        {form.steps.length === 0 ? (
          <Text color="$textMuted" fontSize={13} textAlign="center" paddingVertical="$2">
            {t('newRecipe.manual.step4.empty')}
          </Text>
        ) : (
          <YStack gap="$2">
            {form.steps.map((s, index) => (
              <XStack
                key={index}
                alignItems="center"
                gap="$3"
                paddingVertical={12}
                paddingHorizontal={14}
                borderRadius={14}
                borderWidth={1}
                borderColor="$border"
                backgroundColor="$surface"
                onPress={() => edit(index)}
                pressStyle={{ backgroundColor: '$bgSubtle' }}
              >
                <YStack
                  width={26}
                  height={26}
                  borderRadius={999}
                  backgroundColor={STEP_ACCENTS[index % STEP_ACCENTS.length]}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={13} fontWeight="700" color="$text">
                    {index + 1}
                  </Text>
                </YStack>
                <YStack flex={1} gap={2}>
                  <Text color="$text" fontSize={14} numberOfLines={2}>
                    {s.text}
                  </Text>
                  {s.durationMinutes != null ? (
                    <XStack alignItems="center" gap={4}>
                      <Clock size={12} color={ink} />
                      <Text color="$textMuted" fontSize={12}>
                        {t('time.min', { count: s.durationMinutes })}
                      </Text>
                    </XStack>
                  ) : null}
                </YStack>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    if (editingIndex === index) reset();
                    dispatch({ type: 'removeStep', index });
                  }}
                >
                  <Trash2 size={18} color={danger} />
                </Pressable>
              </XStack>
            ))}
          </YStack>
        )}
      </YStack>
    </StepShell>
  );
}
