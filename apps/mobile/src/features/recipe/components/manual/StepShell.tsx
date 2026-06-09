import type { ReactNode } from 'react';
import { Image } from 'react-native';
import { Text, YStack } from 'tamagui';

import { STEP_IMAGES } from './stepImages';

interface StepShellProps {
  /** Which wizard step (1–5) — selects the fitted illustration. */
  step: number;
  title: string;
  children: ReactNode;
}

/**
 * The white card each wizard step lives in: the step's fitted illustration, the
 * step's question title, then the body.
 */
export function StepShell({ step, title, children }: StepShellProps) {
  return (
    <YStack
      backgroundColor="$surface"
      borderRadius={24}
      padding="$4"
      gap="$4"
      shadowColor="black"
      shadowOpacity={0.06}
      shadowRadius={14}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={2}
    >
      <YStack alignItems="center" gap="$3">
        <Image
          source={STEP_IMAGES[step]}
          style={{ width: 150, height: 130 }}
          resizeMode="contain"
        />
        <Text color="$text" fontSize={22} fontWeight="700" textAlign="center">
          {title}
        </Text>
      </YStack>
      {children}
    </YStack>
  );
}
