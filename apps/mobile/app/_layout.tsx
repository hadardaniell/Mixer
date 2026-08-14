import { QueryClientProvider } from '@tanstack/react-query';
import * as Font from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { useEffect, useState } from 'react';
import { I18nManager, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider, YStack } from 'tamagui';

import { GoogleProvider } from '@/features/auth/components/GoogleProvider';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { AUTH_FONT_FAMILY } from '@/features/auth/authFonts';
import { ExtractionReadyBanner } from '@/features/recipe/components/ExtractionReadyBanner';
import { ExtractionJobProvider } from '@/features/recipe/context/ExtractionJobContext';
import { readInitialSettings, SettingsProvider } from '@/features/settings/context/SettingsContext';
import { queryClient } from '@/shared/lib/queryClient';
import { initI18n, isRTL } from '@/shared/lib/i18n';
import { SplashGate } from '@/shared/ui/SplashGate';
import { APP_BACKGROUND_COLOR } from '@/theme/palette';
import { tamaguiConfig } from '@/theme/tamagui.config';

/**
 * expo-router renders this in place of a crashed route. Without it a render error is a
 * blank white screen, which is undebuggable on a device with no console — iOS Safari in
 * particular. Deliberately built from plain react-native primitives and literal colors:
 * it must still render when the theme, fonts or i18n are what failed.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#1b1b1f' }}
      contentContainerStyle={{ padding: 24, paddingTop: 72 }}
    >
      <Text style={{ color: '#ff8a80', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
        Something crashed
      </Text>
      <Text style={{ color: '#fff', fontSize: 14, marginBottom: 16 }} selectable>
        {error.message}
      </Text>
      <Text style={{ color: '#b0b0b8', fontSize: 11, lineHeight: 16 }} selectable>
        {error.stack}
      </Text>
      <Pressable
        onPress={retry}
        style={{
          marginTop: 24,
          alignSelf: 'flex-start',
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 8,
          backgroundColor: '#3a3a42',
        }}
      >
        <View>
          <Text style={{ color: '#fff', fontSize: 14 }}>Try again</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [initial] = useState(readInitialSettings);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      await Font.loadAsync({
        Heebo: require('../src/assets/fonts/Heebo-wght.ttf'),
        Rubik_400Regular: require('../src/assets/fonts/Rubik_400Regular.ttf'),
        Rubik_500Medium: require('../src/assets/fonts/Rubik_500Medium.ttf'),
        Rubik_700Bold: require('../src/assets/fonts/Rubik_700Bold.ttf'),
      });

      initI18n(initial.language);
      const shouldBeRTL = isRTL(initial.language);
      if (Platform.OS === 'web') {
        if (typeof document !== 'undefined') {
          document.documentElement.dir = shouldBeRTL ? 'rtl' : 'ltr';
          document.documentElement.lang = initial.language;
          document.documentElement.style.backgroundColor = APP_BACKGROUND_COLOR;
          document.body.style.backgroundColor = APP_BACKGROUND_COLOR;
          document.body.style.margin = '0';
          document.body.style.minHeight = '100%';
          let themeColor = document.querySelector('meta[name="theme-color"]');
          if (!themeColor) {
            themeColor = document.createElement('meta');
            themeColor.setAttribute('name', 'theme-color');
            document.head.appendChild(themeColor);
          }
          themeColor.setAttribute('content', APP_BACKGROUND_COLOR);

          // The manifest link used to be created here. It now ships in the served
          // HTML (`app/+html.tsx`), because "Add to Home Screen" reads the
          // document before any of this runs — injecting it from an effect was
          // always too late for the one thing it was for.
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
            @font-face {
              font-family: 'Rubik';
              src: url(${require('../src/assets/fonts/Rubik_400Regular.ttf')}) format('truetype');
              font-weight: 400;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'Rubik';
              src: url(${require('../src/assets/fonts/Rubik_500Medium.ttf')}) format('truetype');
              font-weight: 500 600;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'Rubik';
              src: url(${require('../src/assets/fonts/Rubik_700Bold.ttf')}) format('truetype');
              font-weight: 700 900;
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
              background: ${APP_BACKGROUND_COLOR} !important;
              -webkit-text-size-adjust: 100%;
              text-size-adjust: 100%;
            }
            body > div:first-child {
              min-height: 100%;
              background: ${APP_BACKGROUND_COLOR} !important;
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
              font-family: ${AUTH_FONT_FAMILY}, sans-serif !important;
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: APP_BACKGROUND_COLOR }}>
      <SafeAreaProvider style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <QueryClientProvider client={queryClient}>
            <SettingsProvider initial={initial}>
              <GoogleProvider>
                <AuthProvider>
                  <SplashGate isReady={ready}>
                    {/* Inside the gate, above the router. Inside, because it calls
                        `useTranslation` and mounting that before `initI18n` has run
                        changes react-i18next's hook count on the ready flip — the trap
                        SplashGate documents. Above the router, because an import has to
                        survive the user leaving the screen that started it, and the
                        banner has to reach them wherever they went. */}
                    <ExtractionJobProvider>
                      <YStack flex={1} backgroundColor="$background">
                        <Stack
                          screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: APP_BACKGROUND_COLOR },
                          }}
                        />
                        <ExtractionReadyBanner />
                      </YStack>
                    </ExtractionJobProvider>
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
