import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { storage, StorageKeys } from '@/shared/config/storage';
import type { Language } from '@/shared/lib/i18n';

type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
  language: Language;
  theme: Theme;
}

interface SettingsContextValue extends SettingsState {
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function readInitialSettings(): SettingsState {
  const language = (storage.getString(StorageKeys.language) as Language | undefined) ?? 'he';
  const theme = (storage.getString(StorageKeys.theme) as Theme | undefined) ?? 'system';
  return { language, theme };
}

interface SettingsProviderProps {
  initial: SettingsState;
  children: ReactNode;
}

export function SettingsProvider({ initial, children }: SettingsProviderProps) {
  const [state, setState] = useState<SettingsState>(initial);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      setLanguage: (language) => {
        storage.set(StorageKeys.language, language);
        setState((s) => ({ ...s, language }));
      },
      setTheme: (theme) => {
        storage.set(StorageKeys.theme, theme);
        setState((s) => ({ ...s, theme }));
      },
    }),
    [state],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext must be used inside <SettingsProvider>');
  return ctx;
}
