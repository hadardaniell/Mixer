import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, useTheme, YStack } from 'tamagui';

interface BookStepShellProps {
  Icon?: LucideIcon;
  iconBg?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** White card each create-book step lives in: centered icon blob, title,
 *  subtitle, then the step body. */
export function BookStepShell({
  // Icon,
  iconBg = '$accentPeach',
  title,
  subtitle,
  children,
}: BookStepShellProps) {
  const theme = useTheme();
  const ink = theme.text?.val as string;
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
      <YStack alignItems="center" gap="$2">
        {/* <YStack
          width={72}
          height={72}
          borderRadius={22}
          backgroundColor={iconBg}
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={34} color={ink} strokeWidth={1.6} />
        </YStack> */}
        <Text color="$text" fontSize={22} fontWeight="700" textAlign="center">
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
