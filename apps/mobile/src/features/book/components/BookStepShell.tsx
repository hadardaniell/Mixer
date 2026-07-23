import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, YStack } from 'tamagui';

import { ConceptualIcon } from '@/shared/ui/ConceptualIcon';

interface BookStepShellProps {
  Icon: LucideIcon;
  /** Theme alias for the blob tint, e.g. `$accentPeach`. */
  iconBg?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

// Each accent maps to a fixed blob silhouette so the four steps never look
// stamped, without every step having to pass a variant.
const VARIANT: Record<string, number> = {
  '$accentPeach': 0,
  '$accentMint': 1,
  '$accentPink': 2,
  '$accentLavender': 3,
};

/**
 * The card each create-book step lives in — hairline border (a faint shadow
 * vanishes on the white canvas) with the step's conceptual icon over its title,
 * matching the recipe manual wizard.
 */
export function BookStepShell({
  Icon,
  iconBg = '$accentPeach',
  title,
  subtitle,
  children,
}: BookStepShellProps) {
  return (
    <YStack
      backgroundColor="$surface"
      borderRadius={20}
      borderWidth={1}
      borderColor="$border"
      padding="$4"
      gap="$4"
    >
      <YStack alignItems="center" gap="$2">
        <ConceptualIcon Icon={Icon} blobColor={iconBg} variant={VARIANT[iconBg] ?? 0} size={72} />
        <Text color="$text" fontSize={22} fontWeight="700" letterSpacing={-0.4} textAlign="center">
          {title}
        </Text>
        {subtitle ? (
          <Text color="$textMuted" fontSize={14} textAlign="center">
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {children}
    </YStack>
  );
}
