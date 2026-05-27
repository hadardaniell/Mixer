import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { H1, Input, XStack, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: '#f9f9f9' }}>
      <YStack minHeight="100%" padding="$4" gap="$4" backgroundColor="$background">
        <H1>{t('home.greeting', { name: user?.displayName ?? '' })}</H1>
        <Input placeholder={t('home.searchPlaceholder')} />

        <XStack justifyContent="space-between">
          <H1 size="$6">{t('home.recentlyViewed')}</H1>
        </XStack>

        <XStack justifyContent="space-between">
          <H1 size="$6">{t('home.recentlyImported')}</H1>
        </XStack>
      </YStack>
    </ScrollView>
  );
}
