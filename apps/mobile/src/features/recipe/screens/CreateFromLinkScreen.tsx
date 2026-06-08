import { Globe, Link as LinkIcon, MessageCircle, Play } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { CreateFlowHeader } from '@/features/recipe/components/CreateFlowHeader';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { isRTL } from '@/shared/lib/i18n';
import { IconChip } from '@/shared/ui/IconChip';

const INPUT_FONT = Platform.select({ web: 'Rubik', default: 'Rubik_400Regular' });
const LINK_HERO = require('../../../assets/images/create recipes/create by link.jpg');

export function CreateFromLinkScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isRtl = isRTL(language);
  const ink = theme.text?.val as string;

  const [url, setUrl] = useState('');

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

        {/* Hero */}
        <YStack
          backgroundColor="$surface"
          borderRadius={24}
          padding="$4"
          gap="$2"
          alignItems="center"
          shadowColor="black"
          shadowOpacity={0.08}
          shadowRadius={28}
          shadowOffset={{ width: 0, height: 14 }}
          elevation={5}
        >
          <Image source={LINK_HERO} style={{ width: 200, height: 184 }} resizeMode="contain" />
          <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
            {t('newRecipe.link.heroTitle')}
          </Text>
          <Text color="$textMuted" fontSize={13} textAlign="center">
            {t('newRecipe.link.heroSubtitle')}
          </Text>
        </YStack>

        {/* Link input */}
        <XStack
          alignItems="center"
          gap="$2"
          paddingHorizontal="$3"
          height={56}
          borderRadius={14}
          borderWidth={1.5}
          borderColor="$primary"
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

        {/* CTA — stubbed until the link backend exists */}
        <YStack gap="$1" alignItems="center">
          <YStack
            width="100%"
            height={54}
            borderRadius={20}
            alignItems="center"
            justifyContent="center"
            backgroundColor="$buttonPrimaryBg"
            opacity={0.55}
          >
            <XStack alignItems="center" gap="$2">
              <Text color="$textOnPrimary" fontSize={18} fontWeight="700">
                {t('newRecipe.link.cta')}
              </Text>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
