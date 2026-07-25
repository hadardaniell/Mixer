import { type Dispatch, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import type {
  Category,
  Difficulty,
  ManualForm,
  ManualFormAction,
} from '@/features/recipe/lib/manualRecipe';

import { ChipGroup } from './manual/ChipGroup';
import { ManualTextInput } from './manual/ManualTextInput';

interface Props {
  form: ManualForm;
  dispatch: Dispatch<ManualFormAction>;
}

const PREP_PRESETS = [15, 30, 45];

/**
 * Inline editor for the recipe's meta facts (prep time, difficulty, servings,
 * category) — the edit-mode counterpart to the meta chips under the title. Same
 * chip vocabulary as the create wizard's step 2, without its numbered shell.
 */
export function RecipeMetaEditor({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const patch = (value: Partial<ManualForm>) => dispatch({ type: 'patch', value });

  const prep = form.prepTimeMinutes;
  const isOtherPrep = prep != null && !PREP_PRESETS.includes(prep);
  const [otherMode, setOtherMode] = useState(isOtherPrep);

  const prepOptions = [
    ...PREP_PRESETS.map((m) => ({ value: m, label: t('time.min', { count: m }) })),
    { value: -1, label: t('newRecipe.manual.step2.prepOther') },
  ];
  const difficultyOptions: { value: Difficulty; label: string }[] = [
    { value: 'easy', label: t('newRecipe.manual.step2.diffEasy') },
    { value: 'medium', label: t('newRecipe.manual.step2.diffMedium') },
    { value: 'hard', label: t('newRecipe.manual.step2.diffHard') },
  ];
  const servingsOptions = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 4, label: '4' },
    { value: 6, label: t('newRecipe.manual.step2.servingsMany') },
  ];
  const categoryOptions: { value: Category; label: string }[] = [
    { value: 'main', label: t('newRecipe.manual.step2.catMain') },
    { value: 'dessert', label: t('newRecipe.manual.step2.catDessert') },
    { value: 'healthy', label: t('newRecipe.manual.step2.catHealthy') },
    { value: 'quick', label: t('newRecipe.manual.step2.catQuick') },
  ];

  return (
    <YStack gap="$4" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
      <ChipGroup
        title={t('newRecipe.manual.step2.prepTime')}
        options={prepOptions}
        value={otherMode ? -1 : (prep ?? undefined)}
        onChange={(v) => {
          if (v === -1) {
            setOtherMode(true);
            patch({ prepTimeMinutes: undefined });
          } else {
            setOtherMode(false);
            patch({ prepTimeMinutes: v });
          }
        }}
        selectedBg="$accentLavender"
        trailing={
          otherMode ? (
            <ManualTextInput
              value={prep != null ? String(prep) : ''}
              onChangeText={(val) => {
                const n = parseInt(val.replace(/[^0-9]/g, ''), 10);
                patch({ prepTimeMinutes: Number.isFinite(n) ? n : undefined });
              }}
              placeholder={t('newRecipe.manual.step2.prepOtherPlaceholder')}
              keyboardType="number-pad"
              style={{ width: 96, minHeight: 44 }}
            />
          ) : undefined
        }
      />

      <ChipGroup
        title={t('newRecipe.manual.step2.difficulty')}
        options={difficultyOptions}
        value={form.difficulty}
        onChange={(difficulty) => patch({ difficulty })}
        selectedBg="$accentPeach"
      />

      <ChipGroup
        title={t('newRecipe.manual.step2.servings')}
        options={servingsOptions}
        value={form.servings}
        onChange={(servings) => patch({ servings })}
        selectedBg="$accentMint"
      />

      <ChipGroup
        title={t('newRecipe.manual.step2.category')}
        options={categoryOptions}
        value={form.category}
        onChange={(category) => patch({ category })}
        selectedBg="$accentPink"
      />
    </YStack>
  );
}
