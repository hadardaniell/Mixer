import { XStack, YStack } from 'tamagui';

import { Skeleton } from '@/shared/ui/Skeleton';

/**
 * The book screen's loading state — title block, counts, member avatars, search
 * and a two-column recipe grid, in the same shape the real content lands in.
 */
export function BookSkeleton() {
  return (
    <YStack width="100%" paddingHorizontal={20} paddingTop={16} gap="$4">
      <YStack gap="$2">
        <Skeleton width="64%" height={26} />
        <Skeleton width="88%" height={14} delay={0.06} />
        <Skeleton width="34%" height={12} delay={0.1} />
      </YStack>

      <XStack gap={-12} alignItems="center">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={34} height={34} radius={999} delay={0.12 + i * 0.04} />
        ))}
      </XStack>

      <Skeleton height={44} radius={999} delay={0.24} />

      <YStack gap="$3">
        {[0, 1].map((row) => (
          <XStack key={row} gap="$3">
            <YStack flex={1} gap="$2">
              <Skeleton height={110} radius={8} delay={0.3 + row * 0.08} />
              <Skeleton width="72%" height={13} delay={0.32 + row * 0.08} />
            </YStack>
            <YStack flex={1} gap="$2">
              <Skeleton height={110} radius={8} delay={0.34 + row * 0.08} />
              <Skeleton width="58%" height={13} delay={0.36 + row * 0.08} />
            </YStack>
          </XStack>
        ))}
      </YStack>
    </YStack>
  );
}
