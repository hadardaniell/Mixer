import {
  CheckCircle2,
  CookingPot,
  ListChecks,
  PencilLine,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, YStack } from 'tamagui';

import { ConceptualIcon } from '@/shared/ui/ConceptualIcon';

interface StepShellProps {
  /** Which wizard step (1–5) — selects the conceptual icon. */
  step: number;
  title: string;
  children: ReactNode;
}

/** A conceptual icon + soft blob tint per step, so each step has its own
 *  identity (name → details → ingredients → cooking → review). */
const STEP_ICON: Record<number, LucideIcon> = {
  1: PencilLine,
  2: SlidersHorizontal,
  3: ListChecks,
  4: CookingPot,
  5: CheckCircle2,
};
const STEP_BLOB: Record<number, string> = {
  1: '$accentLavender',
  2: '$accentPink',
  3: '$accentPeach',
  4: '$accentMint',
  5: '$accentLavender',
};

/**
 * The card each wizard step lives in. Hairline border instead of a drop shadow
 * (a faint shadow vanishes on the white canvas), and the step's conceptual icon
 * over its question title — the mood-board line-glyph language, not a bitmap.
 */
export function StepShell({ step, title, children }: StepShellProps) {
  return (
    <YStack
      backgroundColor="$surface"
      borderRadius={20}
      borderWidth={1}
      borderColor="$border"
      padding="$4"
      gap="$4"
    >
      <YStack alignItems="center" gap="$3">
        <ConceptualIcon
          Icon={STEP_ICON[step] ?? PencilLine}
          blobColor={STEP_BLOB[step] ?? '$accentLavender'}
          variant={step - 1}
          size={72}
        />
        <Text color="$text" fontSize={22} fontWeight="700" letterSpacing={-0.4} textAlign="center">
          {title}
        </Text>
      </YStack>
      {children}
    </YStack>
  );
}
