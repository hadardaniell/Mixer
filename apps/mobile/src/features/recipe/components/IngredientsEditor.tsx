import { Plus, Trash2 } from 'lucide-react-native';
import type { Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import type {
  ManualForm,
  ManualFormAction,
  ManualIngredient,
} from '@/features/recipe/lib/manualRecipe';

import { ManualTextInput } from './manual/ManualTextInput';
import { UnitPicker } from './UnitPicker';

interface Props {
  form: ManualForm;
  dispatch: Dispatch<ManualFormAction>;
}

/**
 * Edit-mode twin of {@link IngredientsList}: the same "מצרכים" card, but every
 * ingredient is a live row of inputs (name / amount / unit) pre-filled with the
 * recipe's values, with per-row delete and an add button.
 */
export function IngredientsEditor({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const danger = theme.danger?.val as string;
  const primary = theme.primary?.val as string;

  const update = (index: number, patch: Partial<ManualIngredient>) => {
    const current = form.ingredients[index];
    if (!current) return;
    dispatch({ type: 'updateIngredient', index, value: { ...current, ...patch } });
  };

  const parseAmount = (raw: string): number | undefined => {
    const n = parseFloat(raw.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  };

  return (
    <YStack
      backgroundColor="$surface"
      borderRadius={20}
      paddingHorizontal="$4"
      paddingTop="$3"
      paddingBottom="$3"
      gap="$3"
      shadowColor="black"
      shadowOpacity={0.28}
      shadowRadius={14}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={10}
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      <Text
        fontSize={20}
        fontWeight="700"
        letterSpacing={-0.6}
        color="$text"
        textAlign={isRtl ? 'right' : 'left'}
      >
        {t('recipe.ingredients')}
      </Text>

      <YStack gap="$2">
        {form.ingredients.map((it, index) => (
          <XStack key={index} gap="$2" alignItems="center">
            <ManualTextInput
              value={it.name}
              onChangeText={(name) => update(index, { name })}
              placeholder={t('newRecipe.manual.step3.namePlaceholder')}
              style={{ flex: 2, minHeight: 46 }}
            />
            <ManualTextInput
              value={it.amount != null ? String(it.amount) : ''}
              onChangeText={(v) => update(index, { amount: parseAmount(v) })}
              placeholder={t('newRecipe.manual.step3.amountPlaceholder')}
              keyboardType="numeric"
              style={{ flex: 1, minHeight: 46 }}
            />
            <UnitPicker
              value={it.unit || undefined}
              onChange={(unit) => update(index, { unit })}
              style={{ flex: 1, minHeight: 46 }}
            />
            <Pressable
              hitSlop={8}
              onPress={() => dispatch({ type: 'removeIngredient', index })}
              accessibilityRole="button"
            >
              <Trash2 size={18} color={danger} />
            </Pressable>
          </XStack>
        ))}
      </YStack>

      <XStack
        onPress={() => dispatch({ type: 'addIngredient', value: { name: '' } })}
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
          {t('newRecipe.manual.step3.addIngredient')}
        </Text>
      </XStack>
    </YStack>
  );
}
