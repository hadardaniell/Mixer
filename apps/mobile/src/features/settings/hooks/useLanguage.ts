import { I18nManager, Platform } from 'react-native';
import * as Updates from 'expo-updates';

import { useSettingsContext } from '@/features/settings/context/SettingsContext';
import { settingsApi } from '@/features/settings/api/settingsApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { i18n, isRTL, type Language } from '@/shared/lib/i18n';

export function useLanguage() {
  const { language, setLanguage } = useSettingsContext();
  const { isAuthenticated, user, signIn } = useAuth();

  const changeLanguage = async (next: Language) => {
    if (next === language) return;
    
    // Sync to backend if authenticated
    if (isAuthenticated && user) {
      try {
        const updatedUser = await settingsApi.updateMe({ locale: next });
        // Update the auth context with the new user object containing the new locale
        signIn({ user: updatedUser, token: undefined }); 
      } catch (error) {
        console.error('Failed to sync language to backend:', error);
        // We continue anyway so the local UI updates
      }
    }

    setLanguage(next);
    i18n.changeLanguage(next);

    const shouldBeRTL = isRTL(next);

    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        document.documentElement.dir = shouldBeRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = next;
      }
      return;
    }

    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
      try {
        await Updates.reloadAsync();
      } catch {
        // dev client: caller falls back to a manual restart prompt
      }
    }
  };

  return { language, changeLanguage };
}
