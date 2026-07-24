import { Image as ImageIcon } from 'lucide-react-native';
import type { Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

import type { BookForm, BookFormAction } from '../lib/bookForm';
import { BookPreviewCard } from './BookPreviewCard';
import { BookStepShell } from './BookStepShell';
import { CoverPicker } from './CoverPicker';

interface Props {
  form: BookForm;
  dispatch: Dispatch<BookFormAction>;
}

/**
 * Step 4 — compose the cover from a color and an icon, with a live preview.
 * The picker itself lives in `CoverPicker`, shared with the edit-book sheet.
 */
export function Step4Cover({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  return (
    <BookStepShell
      Icon={ImageIcon}
      iconBg="$accentLavender"
      title={t('createBook.step4.title')}
      subtitle={t('createBook.step4.subtitle')}
    >
      <YStack gap="$4" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
        <YStack alignItems="center">
          <BookPreviewCard form={form} />
        </YStack>
        <CoverPicker
          value={form.coverKey}
          onChange={(coverKey) => dispatch({ type: 'patch', value: { coverKey } })}
        />
      </YStack>
    </BookStepShell>
  );
}
