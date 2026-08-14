import { router } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';

import { HomeFeedSections } from '@/features/home/components/HomeFeedSections';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { HomeSearchBar } from '@/features/search/components/HomeSearchBar';
import { HomeSearchView } from '@/features/search/components/HomeSearchView';

/**
 * Home screen orchestrator. The header + search bar are persistent chrome; the
 * body swaps between two fully independent components — the feed sections and
 * the search view — based on whether the search bar is active.
 */
export function HomeFeedScreen() {
  const insets = useSafeAreaInsets();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <YStack flex={1} backgroundColor="$bg" paddingTop={insets.top + 16}>
      <YStack paddingHorizontal="$4" gap="$3" paddingBottom="$3">
        <HomeHeader onNotificationsPress={() => router.push('/notifications')} />
        <HomeSearchBar
          value={query}
          onChangeText={setQuery}
          active={searching}
          onActivate={() => setSearching(true)}
          onCancel={() => {
            setSearching(false);
            setQuery('');
          }}
        />
      </YStack>

      {searching ? <HomeSearchView query={query} /> : <HomeFeedSections />}
    </YStack>
  );
}
