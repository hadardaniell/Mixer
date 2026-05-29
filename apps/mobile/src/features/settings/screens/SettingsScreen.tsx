import { useTranslation } from 'react-i18next';
import { Button, H2, Paragraph, YStack } from 'tamagui';

import { useLanguage } from '@/features/settings/hooks/useLanguage';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  return (
    <YStack flex={1} padding="$4" gap="$4">
      <H2>{t('settings.title')}</H2>

      <YStack gap="$2">
        <Paragraph>{t('settings.language')}</Paragraph>
        <Button
          onPress={() => changeLanguage('he')}
          theme={language === 'he' ? 'active' : undefined}
        >
          {t('settings.languageHe')}
        </Button>
        <Button
          onPress={() => changeLanguage('en')}
          theme={language === 'en' ? 'active' : undefined}
        >
          {t('settings.languageEn')}
        </Button>
      </YStack>
    </YStack>
  );
}
