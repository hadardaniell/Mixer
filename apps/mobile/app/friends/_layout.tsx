import { Stack } from 'expo-router';

import { AuthGuard } from '@/shared/ui/AuthGuard';
import { APP_BACKGROUND_COLOR } from '@/theme/palette';

export default function FriendsLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: APP_BACKGROUND_COLOR } }} />
    </AuthGuard>
  );
}
