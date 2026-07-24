import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlignLeft } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { feedApi } from '@/features/home/api/feedApi';
import { CreateFlowHeader } from '@/features/recipe/components/CreateFlowHeader';
import { useCreateFromExtraction } from '@/features/recipe/hooks/useCreateFromExtraction';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { isRTL } from '@/shared/lib/i18n';
import { ConceptualIcon } from '@/shared/ui/ConceptualIcon';

const INPUT_FONT = Platform.select({ web: 'Rubik', default: 'Rubik_400Regular' });

export function CreateFromTextScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isRtl = isRTL(language);

  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const create = useCreateFromExtraction();
  const busy = create.isPending;

  const submit = async () => {
    if (!text.trim() || busy) return;
    setError(null);
    try {
      const recipe = await create.mutateAsync({
        extract: () => feedApi.importText(text.trim()),
        sourceType: 'text',
      });
      router.replace(`/recipes/${recipe.id}` as never);
    } catch {
      setError(t('newRecipe.errors.extractFailed'));
    }
  };

  const appendHint = (label: string) => setText((prev) => `${prev}${prev ? '\n' : ''}${label}:\n`);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <YStack
        flex={1}
        width="100%"
        paddingHorizontal="$4"
        paddingTop={insets.top + 24}
        paddingBottom={120}
        gap="$3"
        style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
      >
        <CreateFlowHeader
          title={t('newRecipe.text.title')}
          subtitle={t('newRecipe.text.subtitle')}
        />

        <YStack alignItems="center" paddingVertical="$1">
          <ConceptualIcon Icon={AlignLeft} blobColor="$accentPeach" variant={2} size={84} />
        </YStack>

        <YStack
          flex={1}
          backgroundColor="$surface"
          borderRadius={14}
          borderWidth={focused ? 2 : 1}
          borderColor={focused ? '$borderStrong' : '$border'}
          padding="$3"
          minHeight={120}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('newRecipe.text.placeholder')}
            placeholderTextColor={theme.textMuted?.val as string}
            multiline
            editable={!busy}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            textAlignVertical="top"
            style={[
              {
                flex: 1,
                minHeight: 90,
                fontFamily: INPUT_FONT,
                fontSize: 15,
                color: theme.text?.val as string,
                textAlign: isRtl ? 'right' : 'left',
                borderWidth: 0,
              },
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
            ]}
          />
        </YStack>

        {error ? (
          <Text color="$danger" fontSize={13} textAlign="center">
            {error}
          </Text>
        ) : null}

        <Pressable onPress={submit} disabled={!text.trim() || busy} style={{ width: '100%' }}>
          <YStack
            width="100%"
            height={54}
            borderRadius={20}
            alignItems="center"
            justifyContent="center"
            backgroundColor="$buttonPrimaryBg"
            opacity={!text.trim() || busy ? 0.5 : 1}
            shadowColor="black"
            shadowOpacity={0.28}
            shadowOffset={{ width: 0, height: 6 }}
            shadowRadius={14}
            elevation={10}
            pressStyle={{ backgroundColor: '$buttonPrimaryBgHover' }}
          >
            <Text color="$buttonPrimaryText" fontSize={18} fontWeight="700">
              {busy ? t('newRecipe.creating') : t('newRecipe.text.cta')}
            </Text>
          </YStack>
        </Pressable>

        {/* Inspiration */}
        <YStack gap="$2">
          <XStack alignItems="center" gap="$3">
            <YStack flex={1} height={1} backgroundColor="$border" />
            <Text color="$textMuted" fontSize={13}>
              {t('newRecipe.text.inspireTitle')}
            </Text>
            <YStack flex={1} height={1} backgroundColor="$border" />
          </XStack>
          <XStack flexWrap="wrap" justifyContent="center" gap="$3">
            <InspireChip
              label={t('newRecipe.text.inspire.about')}
              onPress={() => appendHint(t('newRecipe.text.inspire.about'))}
            />
            <InspireChip
              label={t('newRecipe.text.inspire.ingredients')}
              onPress={() => appendHint(t('newRecipe.text.inspire.ingredients'))}
            />
            <InspireChip
              label={t('newRecipe.text.inspire.instructions')}
              onPress={() => appendHint(t('newRecipe.text.inspire.instructions'))}
            />
          </XStack>
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}

function InspireChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      color="$text"
      fontSize={13}
      fontWeight="600"
      paddingVertical={8}
      paddingHorizontal={16}
      borderRadius={999}
      borderWidth={1}
      borderColor="$border"
      backgroundColor="$surface"
      pressStyle={{ backgroundColor: '$bgSubtle' }}
    >
      {label}
    </Text>
  );
}
