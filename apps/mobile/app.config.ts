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
    supportsTablet: false,
  },
  android: {
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
  },
};

export default config;
