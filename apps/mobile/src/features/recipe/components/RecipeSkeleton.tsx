import { YStack, XStack } from 'tamagui';

import { Skeleton } from '@/shared/ui/Skeleton';

/**
 * The recipe screen's loading state.
 *
 * Deliberately mirrors the real layout — cover, title, meta chips, action bar,
 * ingredients, steps — so the content lands into the shape the eye is already
 * holding instead of replacing a spinner. Each bar is offset slightly so the
 * sweep travels down the page rather than flashing all at once.
 */
export function RecipeSkeleton() {
  return (
    <YStack width="100%" paddingHorizontal="$4" gap="$4">
      <Skeleton height={240} radius={20} />

      <YStack gap="$2" alignItems="center">
        <Skeleton width="62%" height={24} delay={0.05} />
        <Skeleton width="84%" height={14} delay={0.1} />
      </YStack>

      <XStack gap="$2" justifyContent="center">
        <Skeleton width={78} height={28} radius={999} delay={0.12} />
        <Skeleton width={78} height={28} radius={999} delay={0.16} />
        <Skeleton width={78} height={28} radius={999} delay={0.2} />
      </XStack>

      <Skeleton height={52} radius={18} delay={0.24} />

      <Skeleton height={190} radius={20} delay={0.3} />

      <YStack gap="$2">
        <Skeleton width="38%" height={20} delay={0.36} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={44} radius={14} delay={0.4 + i * 0.05} />
        ))}
      </YStack>
    </YStack>
  );
}
