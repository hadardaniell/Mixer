import type { ExpoConfig } from 'expo/config';

const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

// Google Sign-In iOS URL scheme is the reversed iOS client ID:
// "636101330680-abc.apps.googleusercontent.com" → "com.googleusercontent.apps.636101330680-abc"
const iosUrlScheme = googleIosClientId
  ? `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}`
  : 'com.googleusercontent.apps.placeholder';

const config: ExpoConfig = {
  name: 'Mixer',
  slug: 'mixer',
  scheme: 'mixer',
  version: '0.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  // The whisk-x from the wordmark, white on ink — the same "black = action" the
  // primary button and the FAB speak. Generated from `mixerXPath.ts`, so the icon and
  // the mark inside the app can never drift apart.
  icon: './src/assets/icon/icon.png',
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
      // Foreground is the bare white x on transparent; the ink is the background layer,
      // which is what lets the launcher mask it to any shape without clipping the glyph.
      foregroundImage: './src/assets/icon/adaptive-icon.png',
      backgroundColor: '#111827',
    },
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          { scheme: 'mixer' },
          { scheme: 'com.hadardaniell.mixer' },
        ],
        category: ['DEFAULT', 'BROWSABLE'],
      },
      {
        action: 'SEND',
        category: ['DEFAULT'],
        data: [
          { mimeType: 'text/plain' },
        ],
      },
    ],
  },
  web: {
    bundler: 'metro',
    favicon: './src/assets/icon/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-localization',
    [
      'expo-notifications',
      {
        // Android draws the status-bar icon as a silhouette — anything but a white
        // glyph on transparent comes out as a grey blob.
        icon: './src/assets/icon/notification-icon.png',
        color: '#111827',
      },
    ],
    [
      '@react-native-google-signin/google-signin',
      { iosUrlScheme },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Mixer needs access to your photos to import a recipe from an image.',
      },
    ],
    [
      'expo-contacts',
      {
        contactsPermission:
          'Mixer uses your contacts to find friends who already use the app. Numbers are matched, not stored.',
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
