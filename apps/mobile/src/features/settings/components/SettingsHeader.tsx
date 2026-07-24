import { router } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { Text, useTheme, View, XStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

interface SettingsHeaderProps {
  title: string;
  /** Rendered at the end of the row (e.g. a save affordance). */
  action?: React.ReactNode;
}

/** Back arrow + title row shared by every settings screen. */
export function SettingsHeader({ title, action }: SettingsHeaderProps) {
  const theme = useTheme();
  const isRtl = useIsRtl();
  const Back = isRtl ? ArrowRight : ArrowLeft;

  return (
    <XStack alignItems="center" gap="$3" paddingVertical="$2">
      <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8}>
        <Back size={26} color={theme.text?.val as string} />
      </Pressable>
      {/* Quiet list-screen title, matching notifications / friends / see-all. */}
      <Text fontSize={13} fontWeight="700" letterSpacing={1.4} color="$textMuted" flex={1}>
        {title}
      </Text>
      {action ? <View>{action}</View> : null}
    </XStack>
  );
}
