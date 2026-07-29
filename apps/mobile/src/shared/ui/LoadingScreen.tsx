import { YStack } from 'tamagui';

import { Loader } from './Loader';

/** Full-screen centered loader on the app canvas — the general "loading…" state
 *  for routes/screens that are still fetching. */
export function LoadingScreen() {
  return (
    <YStack flex={1} backgroundColor="$bg" alignItems="center" justifyContent="center">
      <Loader />
    </YStack>
  );
}
