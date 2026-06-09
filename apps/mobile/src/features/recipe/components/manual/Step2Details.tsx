import { type Dispatch, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import type {
  Category,
  Difficulty,
  ManualForm,
  ManualFormAction,
} from '@/features/recipe/lib/manualRecipe';

import { ChipGroup } from './ChipGroup';
import { ManualTextInput } from './ManualTextInput';
import { StepShell } from './StepShell';

interface Props {
  form: ManualForm;
  dispatch: Dispatch<ManualFormAction>;
}

const PREP_PRESETS = [15, 30, 45];

/** Step 2 — prep time, difficulty, servings and category (all optional). */
export function Step2Details({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const patch = (value: Partial<ManualForm>) => dispatch({ type: 'patch', value });

  const prep = form.prepTimeMinutes;
  const isOtherPrep = prep != null && !PREP_PRESETS.includes(prep);
  const [otherMode, setOtherMode] = useState(isOtherPrep);

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

  const Chip = ({
    label,
    selected,
    onPress,
    bg,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
    bg: string;
  }) => (
    <Text
      onPress={onPress}
      color="$text"
      fontSize={14}
      fontWeight="600"
      paddingVertical={10}
      paddingHorizontal={18}
      borderRadius={999}
      borderWidth={1}
      borderColor={selected ? 'transparent' : '$border'}
      backgroundColor={selected ? bg : '$surface'}
      pressStyle={{ opacity: 0.85 }}
    >
      {label}
    </Text>
  );

  return (
    <StepShell step={2} title={t('newRecipe.manual.step2.title')}>
      <YStack gap="$5">
        {/* Prep time — presets + "other" custom minutes */}
        <YStack gap="$2" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
          <Text color="$text" fontSize={15} fontWeight="700">
            {t('newRecipe.manual.step2.prepTime')}
          </Text>
          <XStack flexWrap="wrap" gap="$2" alignItems="center">
            {PREP_PRESETS.map((m) => (
              <Chip
                key={m}
                label={t('time.min', { count: m })}
                selected={!otherMode && prep === m}
                bg="$accentLavender"
                onPress={() => {
                  setOtherMode(false);
                  patch({ prepTimeMinutes: m });
                }}
              />
            ))}
            <Chip
              label={t('newRecipe.manual.step2.prepOther')}
              selected={otherMode}
              bg="$accentLavender"
              onPress={() => {
                setOtherMode(true);
                patch({ prepTimeMinutes: undefined });
              }}
            />
            {otherMode ? (
              <ManualTextInput
                value={prep != null ? String(prep) : ''}
                onChangeText={(v) => {
                  const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
                  patch({ prepTimeMinutes: Number.isFinite(n) ? n : undefined });
                }}
                placeholder={t('newRecipe.manual.step2.prepOtherPlaceholder')}
                keyboardType="number-pad"
                style={{ width: 96, minHeight: 44 }}
              />
            ) : null}
          </XStack>
        </YStack>

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
    </StepShell>
  );
}
