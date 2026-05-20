import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

import { useSettingsContext } from '@/features/settings/context/SettingsContext';
import { i18n, isRTL, type Language } from '@/shared/lib/i18n';

export function useLanguage() {
  const { language, setLanguage } = useSettingsContext();

  const changeLanguage = async (next: Language) => {
    if (next === language) return;
    setLanguage(next);
    i18n.changeLanguage(next);

    const shouldBeRTL = isRTL(next);
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
      try {
        await Updates.reloadAsync();
      } catch {
        // dev client / web: caller falls back to a manual restart prompt
      }
    }
  };

  return { language, changeLanguage };
}
