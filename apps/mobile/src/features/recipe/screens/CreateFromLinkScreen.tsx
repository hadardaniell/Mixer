import { Globe, Link as LinkIcon, MessageCircle, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { AuthPrimaryButton } from '@/features/auth/components/AuthPrimaryButton';
import { feedApi } from '@/features/home/api/feedApi';
import { CreateFlowHeader } from '@/features/recipe/components/CreateFlowHeader';
import { useExtractionJob } from '@/features/recipe/context/ExtractionJobContext';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { isRTL } from '@/shared/lib/i18n';
import { ConceptualIcon } from '@/shared/ui/ConceptualIcon';
import { IconChip } from '@/shared/ui/IconChip';

const INPUT_FONT = Platform.select({ web: 'Rubik', default: 'Rubik_400Regular' });

export function CreateFromLinkScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRtl = isRTL(language);
  const ink = theme.text?.val as string;

  const [url, setUrl] = useState('');
  const { start } = useExtractionJob();

  // The extraction is handed to the job provider and this screen is replaced by the
  // cooking screen straight away. Nothing is awaited here — that's what lets the user
  // walk away mid-import and be told when it lands.
  const submit = () => {
    if (!url) return;
    start({
      extract: () => feedApi.importUrl(url, language),
      sourceType: 'url',
      sourceUrl: url,
    });
    router.replace('/cooking');
  };

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
          title={t('newRecipe.link.title')}
          subtitle={t('newRecipe.link.subtitle')}
        />

        {/* Hero — conceptual icon on the canvas, no card. */}
        <YStack alignItems="center" gap="$2" paddingVertical="$2">
          <ConceptualIcon Icon={LinkIcon} blobColor="$accentLavender" variant={0} size={92} />
          <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
            {t('newRecipe.link.heroTitle')}
          </Text>
          <Text color="$textMuted" fontSize={13} textAlign="center">
            {t('newRecipe.link.heroSubtitle')}
          </Text>
        </YStack>

        {/* Link input — neutral border, thickens to ink on focus. */}
        <XStack
          alignItems="center"
          gap="$2"
          paddingHorizontal="$3"
          height={56}
          borderRadius={14}
          borderWidth={1}
          borderColor="$border"
          backgroundColor="$surface"
        >
          <LinkIcon size={22} color={ink} />
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder={t('newRecipe.link.inputPlaceholder')}
            placeholderTextColor={theme.textMuted?.val as string}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={[
              {
                flex: 1,
                fontFamily: INPUT_FONT,
                fontSize: 15,
                color: ink,
                textAlign: isRtl ? 'right' : 'left',
                borderWidth: 0,
              },
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
            ]}
          />
        </XStack>

        {/* Supported sources */}
        <YStack gap="$3">
          <XStack alignItems="center" gap="$3">
            <YStack flex={1} height={1} backgroundColor="$border" />
            <Text color="$textMuted" fontSize={13}>
              {t('newRecipe.link.supportedTitle')}
            </Text>
            <YStack flex={1} height={1} backgroundColor="$border" />
          </XStack>
          <XStack justifyContent="center" flexWrap="wrap" gap="$2">
            <IconChip
              label={t('newRecipe.link.supported.web')}
              accent="$accentLavender"
              icon={<Globe size={15} color={ink} />}
            />
            <IconChip
              label={t('newRecipe.link.supported.video')}
              accent="$accentPink"
              icon={<Play size={15} color={ink} />}
            />
            <IconChip
              label={t('newRecipe.link.supported.social')}
              accent="$accentMint"
              icon={<MessageCircle size={15} color={ink} />}
            />
          </XStack>
        </YStack>

        {/* Spacer pushes the CTA to the bottom on tall screens */}
        <YStack flex={1} minHeight="$2" />

        {/* Extraction errors surface on the cooking screen now, not here — this screen
            is gone by the time the import can fail. */}
        <AuthPrimaryButton
          label={t('newRecipe.link.cta')}
          onPress={submit}
          disabled={!url}
        />
      </YStack>
    </KeyboardAvoidingView>
  );
}
