import { Stack } from 'expo-router';

import { APP_BACKGROUND_COLOR } from '@/theme/palette';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: APP_BACKGROUND_COLOR },
      }}
    />
  );
}
