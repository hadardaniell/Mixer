import { I18nManager, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { useQueryClient } from '@tanstack/react-query';

import { useSettingsContext } from '@/features/settings/context/SettingsContext';
import { settingsApi } from '@/features/settings/api/settingsApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { tokens } from '@/features/auth/services/tokens';
import { i18n, isRTL, type Language } from '@/shared/lib/i18n';

export function useLanguage() {
  const { language, setLanguage } = useSettingsContext();
  const { isAuthenticated, user } = useAuth();
  const qc = useQueryClient();

  const changeLanguage = async (next: Language) => {
    if (next === language) return;

    // Sync to backend if authenticated
    if (isAuthenticated && user) {
      try {
        const updatedUser = await settingsApi.updateMe({ locale: next });
        // Update only the cached user object — do NOT call signIn() which would
        // wipe the access token if the token is not also passed.
        tokens.setUser(updatedUser);
      } catch (error) {
        console.error('Failed to sync language to backend:', error);
        // Continue anyway so the local UI updates
      }
    }

    setLanguage(next);
    i18n.changeLanguage(next);

    // Invalidate all recipe/feed caches so they refetch in the new language.
    // Without this, the React Query cache serves stale data in the old language.
    qc.invalidateQueries({ queryKey: ['recipes'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
    qc.invalidateQueries({ queryKey: ['recipe'] });
    qc.invalidateQueries({ queryKey: ['book'] });

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

