import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Globe, LogOut } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { SettingsAccountCard } from '@/features/settings/components/SettingsAccountCard';
import { SettingsHeader } from '@/features/settings/components/SettingsHeader';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { useIsRtl } from '@/shared/lib/useIsRtl';

export function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isRtl = useIsRtl();
  const { user, signOut } = useAuth();
  const { language } = useLanguage();

  const confirmSignOut = () => {
    Alert.alert(t('settings.logOut'), t('settings.logOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logOut'),
        style: 'destructive',
        onPress: () => {
          void signOut().then(() => router.replace('/start'));
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg?.val as string }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      <YStack
        paddingHorizontal={20}
        gap="$5"
        style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
      >
        <SettingsHeader title={t('settings.title')} />

        <SettingsAccountCard user={user} onPress={() => router.push('/settings/profile')} />

        <SettingsSection title={t('settings.sections.account')}>
          <SettingsRow
            icon={Globe}
            label={t('settings.language')}
            value={t(language === 'he' ? 'settings.languageHe' : 'settings.languageEn')}
            accent="$accentMint"
            onPress={() => router.push('/settings/language')}
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow icon={LogOut} label={t('settings.logOut')} destructive onPress={confirmSignOut} />
        </SettingsSection>

        <Text fontSize={12} color="$textSubtle" textAlign="center">
          {t('settings.version', { version: Constants.expoConfig?.version ?? '—' })}
        </Text>
      </YStack>
    </ScrollView>
  );
}
