import { XStack, YStack } from 'tamagui';

import { Skeleton } from '@/shared/ui/Skeleton';

/**
 * Loading placeholder for the profile's content area — a two-column grid of
 * recipe-card shapes, matching the recipes tab so content lands into a held
 * shape instead of replacing a spinner.
 */
export function ProfileContentSkeleton() {
  return (
    <YStack paddingHorizontal="$4" gap={16}>
      {[0, 1, 2].map((row) => (
        <XStack key={row} gap="$3">
          {[0, 1].map((col) => {
            const i = row * 2 + col;
            return (
              <YStack key={col} width="48%" gap="$2">
                <Skeleton height={110} radius={12} delay={i * 0.08} />
                <Skeleton width="72%" height={12} delay={i * 0.08 + 0.04} />
              </YStack>
            );
          })}
        </XStack>
      ))}
    </YStack>
  );
}
