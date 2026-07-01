import { Plus, Trash2 } from 'lucide-react-native';
import { type Dispatch, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import type {
  ManualForm,
  ManualFormAction,
  ManualIngredient,
} from '@/features/recipe/lib/manualRecipe';

import { ManualTextInput } from './ManualTextInput';
import { StepShell } from './StepShell';

interface Props {
  form: ManualForm;
  dispatch: Dispatch<ManualFormAction>;
}

/** Step 3 — structured ingredient editor (amount / unit / name) + list. */
export function Step3Ingredients({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;
  const danger = theme.danger?.val as string;

  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('');
  const [name, setName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const reset = () => {
    setAmount('');
    setUnit('');
    setName('');
    setEditingIndex(null);
  };

  const commit = () => {
    if (!name.trim()) return;
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const value: ManualIngredient = {
      name: name.trim(),
      amount: Number.isFinite(parsedAmount) ? parsedAmount : undefined,
      unit: unit.trim() || undefined,
    };
    if (editingIndex == null) dispatch({ type: 'addIngredient', value });
    else dispatch({ type: 'updateIngredient', index: editingIndex, value });
    reset();
  };

  const edit = (index: number) => {
    const it = form.ingredients[index];
    if (!it) return;
    setAmount(it.amount != null ? String(it.amount) : '');
    setUnit(it.unit ?? '');
    setName(it.name);
    setEditingIndex(index);
  };

  return (
    <StepShell step={3} title={t('newRecipe.manual.step3.title')}>
      <YStack gap="$3" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
        {/* Composer: all three fields in one full-width row (matches the add button) */}
        <XStack gap="$2" width="100%">
          <ManualTextInput
            value={name}
            onChangeText={setName}
            placeholder={t('newRecipe.manual.step3.namePlaceholder')}
            onSubmitEditing={commit}
            style={{ flex: 2 }}
          />
          <ManualTextInput
            value={amount}
            onChangeText={setAmount}
            placeholder={t('newRecipe.manual.step3.amountPlaceholder')}
            keyboardType="numeric"
            style={{ flex: 1 }}
          />
          <ManualTextInput
            value={unit}
            onChangeText={setUnit}
            placeholder={t('newRecipe.manual.step3.unitPlaceholder')}
            style={{ flex: 1 }}
          />
        </XStack>

        <XStack
          onPress={commit}
          alignItems="center"
          justifyContent="center"
          gap="$2"
          paddingVertical={12}
          borderRadius={14}
          backgroundColor="$accentLavender"
          opacity={name.trim() ? 1 : 0.5}
          pressStyle={{ opacity: 0.85 }}
        >
          <Plus size={18} color={theme.primary?.val as string} />
          <Text color="$primary" fontSize={15} fontWeight="700">
            {editingIndex == null
              ? t('newRecipe.manual.step3.addIngredient')
              : t('newRecipe.manual.step3.updateIngredient')}
          </Text>
        </XStack>

        {form.ingredients.length === 0 ? (
          <Text color="$textMuted" fontSize={13} textAlign="center" paddingVertical="$2">
            {t('newRecipe.manual.step3.empty')}
          </Text>
        ) : (
          <YStack gap="$2">
            {form.ingredients.map((it, index) => (
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
                <Text flex={1} color="$text" fontSize={14} numberOfLines={1}>
                  {[it.amount, it.unit, it.name].filter((v) => v != null && v !== '').join(' ')}
                </Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    if (editingIndex === index) reset();
                    dispatch({ type: 'removeIngredient', index });
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
