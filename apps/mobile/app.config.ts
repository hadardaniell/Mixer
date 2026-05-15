import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Mixer',
  slug: 'mixer',
  scheme: 'mixer',
  version: '0.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'com.hadardaniell.mixer',
    supportsTablet: false
  },
  android: {
    package: 'com.hadardaniell.mixer',
    adaptiveIcon: {
      backgroundColor: '#ffffff',
    },
  },
  web: {
    bundler: 'metro',
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
    aiBaseUrl: process.env.EXPO_PUBLIC_AI_BASE_URL ?? 'http://localhost:3001',
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  },
};

export default config;
