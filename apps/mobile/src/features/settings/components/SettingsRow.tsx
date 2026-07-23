import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  /** Trailing summary of the current setting, e.g. the active language. */
  value?: string;
  /** Soft blob color behind the icon. */
  accent?: string;
  /** Renders the label in `$danger` and drops the chevron (log out, delete). */
  destructive?: boolean;
  onPress?: () => void;
}

export function SettingsRow({
  icon: Icon,
  label,
  value,
  accent = '$accentLavender',
  destructive,
  onPress,
}: SettingsRowProps) {
  const theme = useTheme();
  const isRtl = useIsRtl();
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const iconColor = (destructive ? theme.danger?.val : theme.text?.val) as string;

  return (
    <XStack
      onPress={onPress}
      alignItems="center"
      gap="$3"
      paddingHorizontal={16}
      paddingVertical={14}
      pressStyle={onPress ? { backgroundColor: '$bgSubtle' } : undefined}
    >
      <View
        width={36}
        height={36}
        borderRadius={20}
        backgroundColor={destructive ? '$accentPink' : accent}
        alignItems="center"
        justifyContent="center"
      >
        <Icon size={18} color={iconColor} />
      </View>

      <YStack flex={1}>
        <Text fontSize={15} fontWeight="600" color={destructive ? '$danger' : '$text'}>
          {label}
        </Text>
      </YStack>

      {value ? (
        <Text fontSize={13} color="$textMuted">
          {value}
        </Text>
      ) : null}

      {onPress && !destructive ? (
        <Chevron size={18} color={theme.textSubtle?.val as string} />
      ) : null}
    </XStack>
  );
}
