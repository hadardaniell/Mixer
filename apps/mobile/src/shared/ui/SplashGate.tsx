import type { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import { YStack } from 'tamagui';

interface SplashGateProps {
  isReady: boolean;
  children: ReactNode;
}

export function SplashGate({ isReady, children }: SplashGateProps) {
  if (!isReady) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
        <ActivityIndicator />
      </YStack>
    );
  }
  return <>{children}</>;
}
