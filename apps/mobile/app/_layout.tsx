import { QueryClientProvider } from '@tanstack/react-query';
import * as Font from 'expo-font';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';

import { GoogleProvider } from '@/features/auth/components/GoogleProvider';
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
    let cancelled = false;

    const bootstrap = async () => {
      await Font.loadAsync({
        Heebo: require('../src/assets/fonts/Heebo-wght.ttf'),
      });

      initI18n(initial.language);
      const shouldBeRTL = isRTL(initial.language);
      if (Platform.OS === 'web') {
        if (typeof document !== 'undefined') {
          document.documentElement.dir = shouldBeRTL ? 'rtl' : 'ltr';
          document.documentElement.lang = initial.language;
          document.documentElement.style.backgroundColor = '#FFFFFF';
          document.body.style.backgroundColor = '#FFFFFF';
          document.body.style.margin = '0';
          document.body.style.minHeight = '100%';
          let themeColor = document.querySelector('meta[name="theme-color"]');
          if (!themeColor) {
            themeColor = document.createElement('meta');
            themeColor.setAttribute('name', 'theme-color');
            document.head.appendChild(themeColor);
          }
          themeColor.setAttribute('content', '#FFFFFF');
          const styleId = 'app-rtl-overrides';
          let style = document.getElementById(styleId);
          if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
          }
          style.textContent = `
            @font-face {
              font-family: 'Heebo';
              src: url(${require('../src/assets/fonts/Heebo-wght.ttf')}) format('truetype');
              font-weight: 100 900;
              font-style: normal;
              font-display: swap;
            }
            html,
            body,
            #root,
            #__next {
              width: 100%;
              min-height: 100%;
              height: 100%;
              margin: 0;
              background: #FFFFFF !important;
              -webkit-text-size-adjust: 100%;
              text-size-adjust: 100%;
            }
            body > div:first-child {
              min-height: 100%;
              background: #FFFFFF !important;
            }
            html[dir="rtl"] input,
            html[dir="rtl"] textarea {
              direction: rtl;
              text-align: right;
            }
            html[dir="ltr"] input,
            html[dir="ltr"] textarea {
              direction: ltr;
              text-align: left;
            }
            .nsm7Bb-HzV7m-LgbsSe,
            .nsm7Bb-HzV7m-LgbsSe *,
            .nsm7Bb-HzV7m-LgbsSe-BPrWId {
              font-family: 'Heebo', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            }
            .nsm7Bb-HzV7m-LgbsSe-BPrWId {
              -webkit-box-flex: 1;
              flex-grow: 1;
              font-weight: 500 !important;
              overflow: hidden;
              text-overflow: ellipsis;
              vertical-align: top;
              font-size: 14px !important;
            }
          `;
        }
      } else if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
      }
      if (!cancelled) setReady(true);
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [initial.language]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <QueryClientProvider client={queryClient}>
            <SettingsProvider initial={initial}>
              <GoogleProvider>
                <AuthProvider>
                  <SplashGate isReady={ready}>
                    <Slot />
                  </SplashGate>
                </AuthProvider>
              </GoogleProvider>
            </SettingsProvider>
          </QueryClientProvider>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
