import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import he from '@/locales/he.json';

export type Language = 'he' | 'en';

export const SUPPORTED_LANGUAGES: Language[] = ['he', 'en'];

export function isRTL(lang: Language): boolean {
  return lang === 'he';
}

export function initI18n(lang: Language): typeof i18n {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources: {
        he: { translation: he },
        en: { translation: en },
      },
      lng: lang,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
  } else {
    i18n.changeLanguage(lang);
  }
  return i18n;
}

export { i18n };
