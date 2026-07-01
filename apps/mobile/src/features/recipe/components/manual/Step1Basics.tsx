import { ImagePlus } from 'lucide-react-native';
import type { Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import type { ManualForm, ManualFormAction } from '@/features/recipe/lib/manualRecipe';

import { ManualTextInput } from './ManualTextInput';
import { StepShell } from './StepShell';

interface Props {
  form: ManualForm;
  dispatch: Dispatch<ManualFormAction>;
}

/** Step 1 — recipe name, short description, and a (deferred) photo tile. */
export function Step1Basics({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const muted = theme.textMuted?.val as string;

  return (
    <StepShell step={1} title={t('newRecipe.manual.step1.title')}>
      <YStack gap="$4" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
        <YStack gap="$2">
          <Text color="$text" fontSize={15} fontWeight="700">
            {t('newRecipe.manual.step1.nameLabel')}
          </Text>
          <ManualTextInput
            value={form.title}
            onChangeText={(title) => dispatch({ type: 'patch', value: { title } })}
            placeholder={t('newRecipe.manual.step1.namePlaceholder')}
          />
        </YStack>

        <YStack gap="$2">
          <Text color="$text" fontSize={15} fontWeight="700">
            {t('newRecipe.manual.step1.descLabel')}
          </Text>
          <ManualTextInput
            value={form.description}
            onChangeText={(description) => dispatch({ type: 'patch', value: { description } })}
            placeholder={t('newRecipe.manual.step1.descPlaceholder')}
            multiline
          />
        </YStack>

        {/* Photo upload is deferred — the tile is a non-functional placeholder. */}
        <YStack gap="$2">
          <Text color="$text" fontSize={15} fontWeight="700">
            {t('newRecipe.manual.step1.photoLabel')}
          </Text>
          <YStack
            alignItems="center"
            justifyContent="center"
            gap="$2"
            paddingVertical="$5"
            borderRadius={14}
            borderWidth={1}
            borderColor="$border"
            borderStyle="dashed"
            opacity={0.6}
          >
            <ImagePlus size={26} color={muted} />
            <Text color="$textMuted" fontSize={13}>
              {t('newRecipe.manual.step1.photoHint')}
            </Text>
          </YStack>
        </YStack>
      </YStack>
    </StepShell>
  );
}
