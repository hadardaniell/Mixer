import type { Notification } from '@mixer/contracts';
import { useTranslation } from 'react-i18next';
import { Image, Pressable } from 'react-native';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { getNotificationContent } from '@/features/notifications/lib/notificationContent';
import { formatRelativeTime } from '@/features/notifications/lib/relativeTime';
import { isRTL } from '@/shared/lib/i18n';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase() || '?';
}

interface NotificationRowProps {
  notification: Notification;
  onOpen: (notification: Notification) => void;
  onAccept: (notification: Notification) => void;
  onDecline: (notification: Notification) => void;
  actionBusy?: boolean;
}

export function NotificationRow({
  notification,
  onOpen,
  onAccept,
  onDecline,
  actionBusy = false,
}: NotificationRowProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const theme = useTheme();
  const ink = theme.text?.val as string;
  const textAlign = isRTL(language) ? 'right' : 'left';

  const content = getNotificationContent(notification, t);
  const { Icon } = content;
  const iconColor =
    (theme as Record<string, { val: string } | undefined>)[content.color]?.val ?? ink;
  const time = formatRelativeTime(notification.createdAt, t);
  const unread = !notification.read;
  const tappable = !content.action;

  return (
    <Pressable
      onPress={tappable ? () => onOpen(notification) : undefined}
      accessibilityRole={tappable ? 'button' : undefined}
      style={({ pressed }) => ({ opacity: tappable && pressed ? 0.92 : 1 })}
    >
      <XStack
        gap={16}
        paddingVertical="$3"
        paddingHorizontal="$4"
        alignItems="flex-start"
      >
        {content.avatar ? (
          <View
            width={44}
            height={44}
            borderRadius={999}
            overflow="hidden"
            backgroundColor="$bgSubtle"
            alignItems="center"
            justifyContent="center"
          >
            {content.avatar.url ? (
              <Image
                source={{ uri: content.avatar.url }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Text color="$textMuted" fontSize={16} fontWeight="700">
                {initials(content.avatar.name)}
              </Text>
            )}
          </View>
        ) : (
          <View width={44} height={44} alignItems="center" justifyContent="center">
            <Icon size={24} color={iconColor} />
          </View>
        )}

        <YStack flex={1} gap={4}>
          <XStack alignItems="center" gap="$2">
            <View flex={1}>
              <Text
                numberOfLines={1}
                color="$text"
                fontSize={15}
                fontWeight={unread ? '700' : '500'}
                textAlign={textAlign}
              >
                {content.title}
              </Text>
            </View>
            <Text color="$textMuted" fontSize={12}>
              {time}
            </Text>
            {unread ? (
              <View width={8} height={8} borderRadius={999} backgroundColor="$primary" />
            ) : null}
          </XStack>

          <Text color="$textMuted" fontSize={13} lineHeight={18} textAlign={textAlign}>
            {content.body}
          </Text>

          {content.action ? (
            <XStack gap="$2" paddingTop="$2">
              <Pressable
                disabled={actionBusy}
                onPress={() => onAccept(notification)}
                style={({ pressed }) => ({ opacity: actionBusy ? 0.55 : pressed ? 0.85 : 1 })}
              >
                <View
                  backgroundColor="$primary"
                  borderRadius={999}
                  paddingHorizontal={16}
                  paddingVertical={8}
                >
                  <Text color="white" fontSize={14} fontWeight="600">
                    {t('notifications.accept')}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                disabled={actionBusy}
                onPress={() => onDecline(notification)}
                style={({ pressed }) => ({ opacity: actionBusy ? 0.55 : pressed ? 0.85 : 1 })}
              >
                <View
                  backgroundColor="$surface"
                  borderWidth={1}
                  borderColor="$border"
                  borderRadius={999}
                  paddingHorizontal={16}
                  paddingVertical={8}
                >
                  <Text color="$text" fontSize={14} fontWeight="600">
                    {t('notifications.decline')}
                  </Text>
                </View>
              </Pressable>
            </XStack>
          ) : null}
        </YStack>
      </XStack>
    </Pressable>
  );
}
