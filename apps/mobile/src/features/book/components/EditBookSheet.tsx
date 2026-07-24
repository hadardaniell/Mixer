import type { RecipeBook, UpdateRecipeBookInput } from '@mixer/contracts';
import { Plus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { ManualTextInput } from '@/features/recipe/components/manual/ManualTextInput';
import { BookCoverArt } from '@/shared/ui/BookCoverArt';
import { Sheet } from '@/shared/ui/Sheet';

import { CoverPicker } from './CoverPicker';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: RecipeBook;
  busy: boolean;
  onSave: (input: UpdateRecipeBookInput) => void;
}

/** Edit the book's name, description, tags and cover. Owners and editors only. */
export function EditBookSheet({ open, onOpenChange, book, busy, onSave }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [name, setName] = useState(book.name);
  const [description, setDescription] = useState(book.description ?? '');
  const [tags, setTags] = useState<string[]>(book.tags);
  const [tagDraft, setTagDraft] = useState('');
  const [coverKey, setCoverKey] = useState(book.coverKey);

  // Re-seed the form whenever the sheet opens so a cancelled edit doesn't
  // linger, and so a change made elsewhere is reflected.
  useEffect(() => {
    if (!open) return;
    setName(book.name);
    setDescription(book.description ?? '');
    setTags(book.tags);
    setTagDraft('');
    setCoverKey(book.coverKey);
  }, [open, book]);

  const addTag = () => {
    const value = tagDraft.trim();
    if (!value || tags.includes(value)) return;
    setTags([...tags, value]);
    setTagDraft('');
  };

  const save = () => {
    if (!name.trim() || busy) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      tags,
      coverKey,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[88]}>
      <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
        {t('book.edit.title')}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap={16} paddingBottom="$3">
          <YStack gap="$2">
            <Text color="$text" fontSize={15} fontWeight="700">
              {t('createBook.step1.nameLabel')}
            </Text>
            <ManualTextInput
              value={name}
              onChangeText={setName}
              placeholder={t('createBook.step1.namePlaceholder')}
            />
          </YStack>

          <YStack gap="$2">
            <Text color="$text" fontSize={15} fontWeight="700">
              {t('createBook.step1.descLabel')}
            </Text>
            <ManualTextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t('createBook.step1.descPlaceholder')}
              multiline
            />
          </YStack>

          <YStack gap="$2">
            <Text color="$text" fontSize={15} fontWeight="700">
              {t('createBook.step1.tagsLabel')}
            </Text>
            <XStack gap="$2" alignItems="center">
              <YStack flex={1}>
                <ManualTextInput
                  value={tagDraft}
                  onChangeText={setTagDraft}
                  onSubmitEditing={addTag}
                  placeholder={t('createBook.step1.tagsPlaceholder')}
                  returnKeyType="done"
                />
              </YStack>
              <YStack
                onPress={addTag}
                width={50}
                height={50}
                borderRadius={999}
                backgroundColor="$accentLavender"
                alignItems="center"
                justifyContent="center"
                pressStyle={{ opacity: 0.8 }}
              >
                <Plus size={22} color={theme.textOnPrimary?.val as string} strokeWidth={2.5} />
              </YStack>
            </XStack>
            {tags.length > 0 ? (
              <XStack flexWrap="wrap" gap="$2">
                {tags.map((tag) => (
                  <XStack
                    key={tag}
                    onPress={() => setTags(tags.filter((x) => x !== tag))}
                    alignItems="center"
                    gap="$1"
                    paddingHorizontal={12}
                    paddingVertical={6}
                    borderRadius={999}
                    backgroundColor="$accentLavender"
                    pressStyle={{ opacity: 0.8 }}
                  >
                    <Text color="$textOnPrimary" fontSize={13} fontWeight="600">
                      {tag}
                    </Text>
                    <X size={13} color={theme.textOnPrimary?.val as string} strokeWidth={2.5} />
                  </XStack>
                ))}
              </XStack>
            ) : null}
          </YStack>

          <YStack gap="$3">
            <Text color="$text" fontSize={15} fontWeight="700">
              {t('createBook.step4.title')}
            </Text>
            {/* Live preview of the composed cover */}
            <View alignSelf="center" width={92} height={92} borderRadius={16} overflow="hidden">
              <BookCoverArt coverKey={coverKey} size={92} radius={16} />
            </View>
            <CoverPicker value={coverKey} onChange={setCoverKey} />
          </YStack>
        </YStack>
      </ScrollView>

      <YStack
        onPress={save}
        disabled={!name.trim() || busy}
        height={54}
        borderRadius={20}
        backgroundColor="$buttonPrimaryBg"
        alignItems="center"
        justifyContent="center"
        opacity={!name.trim() || busy ? 0.55 : 1}
        pressStyle={{ backgroundColor: '$buttonPrimaryBgHover' }}
      >
        <Text color="$buttonPrimaryText" fontSize={16} fontWeight="700">
          {busy ? t('book.edit.saving') : t('book.edit.save')}
        </Text>
      </YStack>
    </Sheet>
  );
}
