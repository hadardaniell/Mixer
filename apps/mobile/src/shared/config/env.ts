import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

// Android emulator can't reach the host's `localhost` — it sits on a
// per-VM loopback. Swap localhost/127.0.0.1 for the host alias 10.0.2.2.
// iOS simulator and web share the host's loopback, so they're untouched.
function resolveHost(url: string): string {
  if (Platform.OS !== 'android') return url;
  return url.replace(/^http:\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/, 'http://10.0.2.2');
}

export const env = {
  apiUrl: resolveHost(extra.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'),
  aiUrl: resolveHost(extra.aiBaseUrl || process.env.EXPO_PUBLIC_AI_BASE_URL || 'http://localhost:3001'),
  googleIosClientId: extra.googleIosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  googleAndroidClientId: extra.googleAndroidClientId || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  googleWebClientId: extra.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
} as const;
