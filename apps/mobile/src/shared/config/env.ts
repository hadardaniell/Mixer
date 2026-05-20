import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const env = {
  apiUrl: extra.apiBaseUrl ?? 'http://localhost:3000',
  aiUrl: extra.aiBaseUrl ?? 'http://localhost:3001',
  googleIosClientId: extra.googleIosClientId ?? '',
  googleAndroidClientId: extra.googleAndroidClientId ?? '',
  googleWebClientId: extra.googleWebClientId ?? '',
} as const;
