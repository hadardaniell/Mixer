import type { RecipeBook, UpdateRecipeBookInput } from '@mixer/contracts';
import { Check, Plus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { ManualTextInput } from '@/features/recipe/components/manual/ManualTextInput';
import { COVER_IMAGES, COVER_KEYS } from '@/shared/lib/coverImages';
import { Sheet } from '@/shared/ui/Sheet';

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
                <Plus size={22} color={theme.primary?.val as string} strokeWidth={2.5} />
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
                    <Text color="$primary" fontSize={13} fontWeight="600">
                      {tag}
                    </Text>
                    <X size={13} color={theme.primary?.val as string} strokeWidth={2.5} />
                  </XStack>
                ))}
              </XStack>
            ) : null}
          </YStack>

          <YStack gap="$2">
            <Text color="$text" fontSize={15} fontWeight="700">
              {t('createBook.step4.title')}
            </Text>
            <XStack flexWrap="wrap" gap="$3" justifyContent="space-between">
              {COVER_KEYS.map((key) => {
                const selected = coverKey === key;
                return (
                  <YStack
                    key={key}
                    width="30%"
                    aspectRatio={1}
                    marginBottom="$2"
                    borderRadius={18}
                    borderWidth={1}
                    borderColor={selected ? '$accentCoral' : '$border'}
                    overflow="hidden"
                    onPress={() => setCoverKey(key)}
                    pressStyle={{ opacity: 0.9 }}
                  >
                    <Image
                      source={COVER_IMAGES[key]}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    {selected ? (
                      <YStack
                        position="absolute"
                        top={10}
                        right={10}
                        width={22}
                        height={22}
                        borderRadius={999}
                        backgroundColor="$accentCoral"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Check
                          size={13}
                          color={theme.textOnPrimary?.val as string}
                          strokeWidth={3}
                        />
                      </YStack>
                    ) : null}
                  </YStack>
                );
              })}
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>

      <YStack
        onPress={save}
        disabled={!name.trim() || busy}
        height={54}
        borderRadius={20}
        backgroundColor="$primary"
        alignItems="center"
        justifyContent="center"
        opacity={!name.trim() || busy ? 0.55 : 1}
        pressStyle={{ backgroundColor: '$buttonPrimaryBgHover' }}
      >
        <Text color="$textOnPrimary" fontSize={16} fontWeight="700">
          {busy ? t('book.edit.saving') : t('book.edit.save')}
        </Text>
      </YStack>
    </Sheet>
  );
}
