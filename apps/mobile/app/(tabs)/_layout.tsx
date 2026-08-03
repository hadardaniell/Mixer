import { Redirect, Tabs, type Href } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePushTokenRegistration } from '@/features/notifications/hooks/usePushTokenRegistration';
import { TabBar } from '@/shared/ui/TabBar';
import { APP_BACKGROUND_COLOR } from '@/theme/palette';

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();
  usePushTokenRegistration();

  // Every tab is signed-in-only, but they're reachable directly — a typed /home URL, a
  // shared link, or the back button after signing out. Redirecting from the layout keeps
  // the screens from mounting at all, so none of them fire authenticated queries first.
  if (!isAuthenticated) return <Redirect href={'/start' as Href} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: APP_BACKGROUND_COLOR },
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="new-recipe" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="books" />
    </Tabs>
  );
}
