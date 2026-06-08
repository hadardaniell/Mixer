import { Tabs } from 'expo-router';

import { TabBar } from '@/shared/ui/TabBar';
import { APP_BACKGROUND_COLOR } from '@/theme/palette';

export default function TabsLayout() {
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
    </Tabs>
  );
}
