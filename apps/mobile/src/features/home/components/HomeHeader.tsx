import { Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, View, XStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';

interface HomeHeaderProps {
  onNotificationsPress?: () => void;
}

/**
 * Top bar: avatar + a small greeting on the start side, bell pushed to the end.
 *
 * The greeting is deliberately **not** the hero — it's a 15px line beside a
 * 34px avatar. The typographic weight on this screen belongs to the section
 * headings, so the eye lands on content rather than on a salutation you've
 * already read a hundred times.
 *
 * The XStack inherits the app's UI direction, so the cluster sits on the right
 * in RTL and on the left in LTR, with the bell always at the far end.
 */
export function HomeHeader({ onNotificationsPress }: HomeHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const ink = theme.text?.val as string;

  const name = user?.displayName ?? '';
  const greeting = t('home.greeting', { name });
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <XStack width="100%" alignItems="center" gap="$3" paddingHorizontal="$3" paddingVertical="$2">
      <View
        width={34}
        height={34}
        borderRadius={999}
        backgroundColor="$bgSubtle"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="$textMuted" fontSize={13} fontWeight="700">
          {initial || '?'}
        </Text>
      </View>

      <Text flex={1} color="$text" fontSize={15} fontWeight="700" letterSpacing={-0.2} numberOfLines={1}>
        {greeting}
      </Text>

      <Pressable onPress={onNotificationsPress} accessibilityRole="button" hitSlop={8}>
        <View>
          <Bell size={21} color={ink} strokeWidth={1.7} />
          {unreadCount > 0 ? (
            <View
              position="absolute"
              top={-5}
              right={-6}
              minWidth={16}
              height={16}
              borderRadius={999}
              paddingHorizontal={3}
              backgroundColor="$danger"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="white" fontSize={10} fontWeight="700">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </XStack>
  );
}
