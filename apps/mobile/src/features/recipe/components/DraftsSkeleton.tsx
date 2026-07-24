import { XStack, YStack } from 'tamagui';

import { Skeleton } from '@/shared/ui/Skeleton';

/**
 * Loading placeholder for the drafts list — a few rows shaped like `DraftCard`
 * (icon square, two text lines, trash), so the drafts land into a held shape
 * instead of popping in. Matches the shimmer used on the recipe screen.
 */
export function DraftsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <YStack gap="$2">
      {Array.from({ length: rows }).map((_, i) => (
        <XStack
          key={i}
          alignItems="center"
          gap="$2"
          padding="$3"
          borderRadius={18}
          backgroundColor="$surface"
          shadowColor="black"
          shadowOpacity={0.16}
          shadowRadius={12}
          shadowOffset={{ width: 0, height: 5 }}
          elevation={6}
        >
          <Skeleton width={42} height={42} radius={12} delay={i * 0.12} />
          <YStack flex={1} gap={6}>
            <Skeleton width="55%" height={13} delay={i * 0.12 + 0.05} />
            <Skeleton width="35%" height={11} delay={i * 0.12 + 0.1} />
          </YStack>
          <Skeleton width={18} height={18} radius={5} delay={i * 0.12 + 0.15} />
        </XStack>
      ))}
    </YStack>
  );
}
