import { BookHeart } from 'lucide-react-native';
import { type Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, YStack } from 'tamagui';

import { ManualTextInput } from '@/features/recipe/components/manual/ManualTextInput';
import { useIsRtl } from '@/shared/lib/useIsRtl';

import type { BookForm, BookFormAction } from '../lib/bookForm';
import { BookStepShell } from './BookStepShell';

interface Props {
  form: BookForm;
  dispatch: Dispatch<BookFormAction>;
}

/** Step 1 — book name, description, and a live preview. */
export function Step1Basics({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  return (
    <BookStepShell
      // Icon={BookHeart}
      iconBg="$accentPeach"
      title={t('createBook.step1.title')}
      subtitle={t('createBook.step1.subtitle')}
    >
      <YStack gap="$4" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
        <YStack gap="$2">
          <Text color="$text" fontSize={15} fontWeight="700">
            {t('createBook.step1.nameLabel')}
          </Text>
          <ManualTextInput
            value={form.name}
            onChangeText={(name) => dispatch({ type: 'patch', value: { name } })}
            placeholder={t('createBook.step1.namePlaceholder')}
          />
        </YStack>

        <YStack gap="$2">
          <Text color="$text" fontSize={15} fontWeight="700">
            {t('createBook.step1.descLabel')}
          </Text>
          <ManualTextInput
            value={form.description}
            onChangeText={(description) => dispatch({ type: 'patch', value: { description } })}
            placeholder={t('createBook.step1.descPlaceholder')}
            multiline
          />
        </YStack>
      </YStack>
    </BookStepShell>
  );
}
