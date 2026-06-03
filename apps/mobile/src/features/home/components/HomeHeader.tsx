import { Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, View, XStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';

interface HomeHeaderProps {
  onNotificationsPress?: () => void;
}

/**
 * Top bar: greeting + notification bell, **clustered on the start side**.
 * The XStack inherits the app's UI direction, so:
 *   - RTL: greeting on the right, bell to its left (right-side cluster).
 *   - LTR: greeting on the left, bell to its right (left-side cluster).
 */
export function HomeHeader({ onNotificationsPress }: HomeHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const ink = theme.text?.val as string;

  const name = user?.displayName ?? '';
  const greeting = t('home.greeting', { name });

  return (
    <XStack width="100%" alignItems="center" gap="$3" justifyContent="flex-start"
    padding="$3">
      <Pressable onPress={onNotificationsPress} accessibilityRole="button" hitSlop={8}>
        <Bell size={20} color={ink} />
      </Pressable>
      <Text color="$text" fontSize={21} fontWeight="700" letterSpacing={-0.5}>
        {greeting}
      </Text>
    </XStack>
  );
}
