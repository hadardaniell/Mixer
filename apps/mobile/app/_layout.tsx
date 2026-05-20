import { QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';

import { AuthProvider } from '@/features/auth/context/AuthContext';
import { readInitialSettings, SettingsProvider } from '@/features/settings/context/SettingsContext';
import { queryClient } from '@/shared/lib/queryClient';
import { initI18n, isRTL } from '@/shared/lib/i18n';
import { SplashGate } from '@/shared/ui/SplashGate';
import { tamaguiConfig } from '@/theme/tamagui.config';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [initial] = useState(readInitialSettings);

  useEffect(() => {
    initI18n(initial.language);
    const shouldBeRTL = isRTL(initial.language);
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        document.documentElement.dir = shouldBeRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = initial.language;
      }
    } else if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
    }
    setReady(true);
  }, [initial.language]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <QueryClientProvider client={queryClient}>
            <SettingsProvider initial={initial}>
              <AuthProvider>
                <SplashGate isReady={ready}>
                  <Slot />
                </SplashGate>
              </AuthProvider>
            </SettingsProvider>
          </QueryClientProvider>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
