import { BookHeart, Plus, X } from 'lucide-react-native';
import { type Dispatch, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { ManualTextInput } from '@/features/recipe/components/manual/ManualTextInput';
import { useIsRtl } from '@/shared/lib/useIsRtl';

import type { BookForm, BookFormAction } from '../lib/bookForm';
import { BookPreviewCard } from './BookPreviewCard';
import { BookStepShell } from './BookStepShell';

interface Props {
  form: BookForm;
  dispatch: Dispatch<BookFormAction>;
}

/** Step 1 — book name, description, tags, and a live preview. */
export function Step1Basics({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const primary = theme.primary?.val as string;
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    dispatch({ type: 'addTag', value: v });
    setTagInput('');
  };

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

        <YStack gap="$2">
          <Text color="$text" fontSize={15} fontWeight="700">
            {t('createBook.step1.tagsLabel')}
          </Text>
          <XStack gap="$2">
            <ManualTextInput
              value={tagInput}
              onChangeText={setTagInput}
              placeholder={t('createBook.step1.tagsPlaceholder')}
              onSubmitEditing={addTag}
              style={{ flex: 1 }}
            />
            <Pressable onPress={addTag} hitSlop={6}>
              <YStack
                width={50}
                height={50}
                borderRadius={14}
                backgroundColor="$accentLavender"
                alignItems="center"
                justifyContent="center"
                opacity={tagInput.trim() ? 1 : 0.5}
              >
                <Plus size={20} color={primary} />
              </YStack>
            </Pressable>
          </XStack>
          {form.tags.length > 0 ? (
            <XStack flexWrap="wrap" gap="$2">
              {form.tags.map((tag) => (
                <XStack
                  key={tag}
                  alignItems="center"
                  gap={6}
                  paddingVertical={6}
                  paddingHorizontal={12}
                  borderRadius={999}
                  backgroundColor="$accentLavender"
                >
                  <Text color="$primary" fontSize={13} fontWeight="600">
                    {tag}
                  </Text>
                  <Pressable onPress={() => dispatch({ type: 'removeTag', value: tag })} hitSlop={6}>
                    <X size={14} color={primary} />
                  </Pressable>
                </XStack>
              ))}
            </XStack>
          ) : null}
        </YStack>
      </YStack>
    </BookStepShell>
  );
}
