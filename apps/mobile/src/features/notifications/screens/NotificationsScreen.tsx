import type { Notification } from '@mixer/contracts';
import { router, useFocusEffect } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner, Text, useTheme, View, XStack, YStack } from 'tamagui';

import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import { useNotificationActions } from '@/features/notifications/hooks/useNotificationActions';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { getNotificationContent } from '@/features/notifications/lib/notificationContent';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { isRTL } from '@/shared/lib/i18n';

export function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRtl = isRTL(language);
  const ink = theme.text?.val as string;

  const { notifications, isLoading, isError, refetch } = useNotifications();
  const actions = useNotificationActions();

  // Refetch immediately whenever the screen gains focus (polling handles the rest).
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const actionBusy =
    actions.acceptFriend.isPending ||
    actions.declineFriend.isPending ||
    actions.acceptShare.isPending ||
    actions.declineShare.isPending;

  const onOpen = (n: Notification) => {
    if (!n.read) actions.markRead.mutate(n.id);
    const route = getNotificationContent(n, t).route;
    if (route) router.push(route);
  };

  const onAccept = (n: Notification) => {
    if (n.type === 'FRIEND_REQUEST') {
      actions.acceptFriend.mutate({ notificationId: n.id, fromUserId: n.payload.fromUserId });
    } else if (n.type === 'SHARE_REQUEST') {
      actions.acceptShare.mutate({ notificationId: n.id, shareId: n.payload.shareId });
    }
  };

  const onDecline = (n: Notification) => {
    if (n.type === 'FRIEND_REQUEST') {
      actions.declineFriend.mutate({ notificationId: n.id, fromUserId: n.payload.fromUserId });
    } else if (n.type === 'SHARE_REQUEST') {
      actions.declineShare.mutate({ notificationId: n.id, shareId: n.payload.shareId });
    }
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$bg"
      paddingTop={insets.top + 8}
      paddingBottom={insets.bottom}
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      <XStack width="100%" alignItems="center" paddingHorizontal="$4" paddingVertical="$2" gap="$3">
        <Pressable
          accessibilityRole="button"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          hitSlop={8}
        >
          <ArrowRight size={26} color={ink} />
        </Pressable>
        <Text flex={1} color="$text" fontSize={20} fontWeight="700">
          {t('notifications.title')}
        </Text>
        {notifications.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => actions.markAllRead.mutate()}
            disabled={actions.markAllRead.isPending}
            hitSlop={8}
          >
            <Text color="$primary" fontSize={14} fontWeight="600">
              {t('notifications.markAllRead')}
            </Text>
          </Pressable>
        ) : null}
      </XStack>

      {isLoading ? (
        <View flex={1} alignItems="center" justifyContent="center">
          <Spinner color="$primary" />
        </View>
      ) : isError ? (
        <View flex={1} alignItems="center" justifyContent="center" padding="$5">
          <Text color="$textMuted" fontSize={15} textAlign="center">
            {t('notifications.error')}
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        <View flex={1} alignItems="center" justifyContent="center" padding="$5">
          <Text color="$textMuted" fontSize={15} textAlign="center">
            {t('notifications.empty')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onOpen={onOpen}
              onAccept={onAccept}
              onDecline={onDecline}
              actionBusy={actionBusy}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 24, gap: 4 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </YStack>
  );
}
