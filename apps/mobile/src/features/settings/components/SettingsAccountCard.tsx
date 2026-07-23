import type { PublicUser } from '@mixer/contracts';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Image } from 'react-native';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { initials } from '@/features/profile/lib/initials';
import { useIsRtl } from '@/shared/lib/useIsRtl';

interface SettingsAccountCardProps {
  user: PublicUser | null;
  onPress: () => void;
}

/** Tappable identity card at the top of the settings list. */
export function SettingsAccountCard({ user, onPress }: SettingsAccountCardProps) {
  const theme = useTheme();
  const isRtl = useIsRtl();
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <XStack
      onPress={onPress}
      alignItems="center"
      gap="$3"
      padding={14}
      borderRadius={18}
      backgroundColor="$surface"
      shadowColor="black"
      shadowOpacity={0.06}
      shadowRadius={14}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={2}
      pressStyle={{ backgroundColor: '$bgSubtle' }}
    >
      <View
        width={52}
        height={52}
        borderRadius={999}
        overflow="hidden"
        backgroundColor="$accentLavender"
        alignItems="center"
        justifyContent="center"
      >
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text color="$primary" fontSize={20} fontWeight="700">
            {initials(user?.displayName)}
          </Text>
        )}
      </View>

      <YStack flex={1} gap={2}>
        <Text fontSize={16} fontWeight="700" color="$text" numberOfLines={1}>
          {user?.displayName ?? ''}
        </Text>
        <Text fontSize={13} color="$textMuted" numberOfLines={1}>
          {user?.email ?? ''}
        </Text>
      </YStack>

      <Chevron size={18} color={theme.textSubtle?.val as string} />
    </XStack>
  );
}
