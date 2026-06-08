import type { ExpoConfig } from 'expo/config';

const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

// Google Sign-In iOS URL scheme is the reversed iOS client ID:
// "636101330680-abc.apps.googleusercontent.com" → "com.googleusercontent.apps.636101330680-abc"
const iosUrlScheme = googleIosClientId
  ? `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}`
  : undefined;

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
    supportsTablet: false,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
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
  plugins: [
    'expo-router',
    'expo-localization',
    [
      '@react-native-google-signin/google-signin',
      iosUrlScheme ? { iosUrlScheme } : {},
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Mixer needs access to your photos to import a recipe from an image.',
      },
    ],
  ],
  experiments: {
    typedRoutes: false,
  },
  extra: {
    eas: {
      projectId: '1c7c5a58-6fb3-4e80-b006-6044f3744a3f',
    },
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
    aiBaseUrl: process.env.EXPO_PUBLIC_AI_BASE_URL ?? 'http://localhost:3001',
    googleIosClientId,
    googleAndroidClientId,
    googleWebClientId,
  },
};

export default config;
