import { Tabs } from 'expo-router';
import { useState } from 'react';
import { H3, Paragraph, YStack } from 'tamagui';
import { useTranslation } from 'react-i18next';

import { Sheet } from '@/shared/ui/Sheet';
import { TabBar } from '@/shared/ui/TabBar';
import { APP_BACKGROUND_COLOR } from '@/theme/palette';

export default function TabsLayout() {
  const { t } = useTranslation();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: APP_BACKGROUND_COLOR },
        }}
        tabBar={(props) => <TabBar {...props} onAddPress={() => setAddOpen(true)} />}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="profile" />
      </Tabs>

      <Sheet open={addOpen} onOpenChange={setAddOpen} snapPoints={[55]}>
        <H3>{t('add.title')}</H3>
        <YStack gap="$2">
          <AddOption title={t('add.newRecipe')} desc={t('add.newRecipeDesc')} />
          <AddOption title={t('add.newBook')} desc={t('add.newBookDesc')} />
          <AddOption title={t('add.mealBuilder')} desc={t('add.mealBuilderDesc')} />
        </YStack>
      </Sheet>
    </>
  );
}

function AddOption({ title, desc }: { title: string; desc: string }) {
  return (
    <YStack
      padding="$3"
      borderRadius="$4"
      backgroundColor="$gray2"
      pressStyle={{ opacity: 0.8 }}
    >
      <Paragraph fontWeight="600">{title}</Paragraph>
      <Paragraph size="$2" color="$gray11">
        {desc}
      </Paragraph>
    </YStack>
  );
}
