import { Check, ImageIcon } from 'lucide-react-native';
import type { Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { COVER_IMAGES, COVER_KEYS } from '@/shared/lib/coverImages';
import { useIsRtl } from '@/shared/lib/useIsRtl';

import type { BookForm, BookFormAction } from '../lib/bookForm';
import { BookPreviewCard } from './BookPreviewCard';
import { BookStepShell } from './BookStepShell';

interface Props {
  form: BookForm;
  dispatch: Dispatch<BookFormAction>;
}

/** Step 4 — pick a cover from the bundled illustrations + live preview. */
export function Step4Cover({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const checkColor = theme.textOnPrimary?.val as string;

  return (
    <BookStepShell
      Icon={ImageIcon}
      iconBg="$accentLavender"
      title={t('createBook.step4.title')}
      subtitle={t('createBook.step4.subtitle')}
    >
      <YStack gap="$4" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
        <XStack flexWrap="wrap" gap="$3" justifyContent="space-between">
          {COVER_KEYS.map((key) => {
            const selected = form.coverKey === key;
            return (
              <YStack
                key={key}
                width="30%"
                aspectRatio={1}
                borderRadius={18}
                borderWidth={2}
                borderColor={selected ? '$accentOrange' : '$border'}
                overflow="hidden"
                onPress={() => dispatch({ type: 'patch', value: { coverKey: key } })}
                pressStyle={{ opacity: 0.9 }}
              >
                <Image source={COVER_IMAGES[key]} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                {selected ? (
                  <YStack
                    position="absolute"
                    top={6}
                    end={6}
                    width={22}
                    height={22}
                    borderRadius={999}
                    backgroundColor="$accentOrange"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Check size={13} color={checkColor} strokeWidth={3} />
                  </YStack>
                ) : null}
              </YStack>
            );
          })}
        </XStack>

        <YStack gap="$2">
          <Text color="$textMuted" fontSize={13} fontWeight="600">
            {t('createBook.preview.label')}
          </Text>
          <BookPreviewCard form={form} />
        </YStack>
      </YStack>
    </BookStepShell>
  );
}
