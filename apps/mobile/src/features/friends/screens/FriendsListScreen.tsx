import { router } from 'expo-router';
import { ArrowRight, UserMinus, UserPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner, Text, useTheme, View, XStack, YStack } from 'tamagui';

import type { Friend } from '@/features/friends/api/friendsApi';
import { useFriendActions } from '@/features/friends/hooks/useFriendActions';
import { useFriends } from '@/features/friends/hooks/useFriends';
import { useIsRtl } from '@/shared/lib/useIsRtl';

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase() || '?';
}

export function FriendsListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;

  const { friends, isLoading, isError } = useFriends();
  const { unfriend } = useFriendActions();

  const confirmRemove = (friend: Friend) => {
    const name = friend.displayName ?? '';
    Alert.alert(
      t('friends.removeTitle'),
      t('friends.removeMessage', { name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('friends.remove'),
          style: 'destructive',
          onPress: () => unfriend.mutate(friend.id),
        },
      ],
    );
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
          {t('friends.listTitle')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/friends/add')}
          hitSlop={8}
        >
          <UserPlus size={24} color={ink} />
        </Pressable>
      </XStack>

      {isLoading ? (
        <View flex={1} alignItems="center" justifyContent="center">
          <Spinner color="$primary" />
        </View>
      ) : isError ? (
        <Centered text={t('friends.error')} />
      ) : friends.length === 0 ? (
        <Centered text={t('friends.empty')} />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(f) => f.id}
          renderItem={({ item }) => (
            <FriendRow
              friend={item}
              busy={unfriend.isPending && unfriend.variables === item.id}
              onRemove={confirmRemove}
            />
          )}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </YStack>
  );
}

function FriendRow({
  friend,
  busy,
  onRemove,
}: {
  friend: Friend;
  busy: boolean;
  onRemove: (friend: Friend) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();

  return (
    <XStack alignItems="center" gap="$3" paddingVertical="$2" paddingHorizontal="$4">
      <View
        width={48}
        height={48}
        borderRadius={999}
        overflow="hidden"
        backgroundColor="$accentLavender"
        alignItems="center"
        justifyContent="center"
      >
        {friend.avatarUrl ? (
          <Image source={{ uri: friend.avatarUrl }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text color="$primary" fontSize={17} fontWeight="700">
            {initials(friend.displayName)}
          </Text>
        )}
      </View>
      <Text
        flex={1}
        color="$text"
        fontSize={15}
        fontWeight="600"
        numberOfLines={1}
        textAlign={isRtl ? 'right' : 'left'}
      >
        {friend.displayName ?? ''}
      </Text>

      <XStack
        onPress={() => !busy && onRemove(friend)}
        disabled={busy}
        alignItems="center"
        gap="$1"
        paddingHorizontal="$3"
        height={36}
        borderRadius={999}
        backgroundColor="$surface"
        borderWidth={1}
        borderColor="$border"
        opacity={busy ? 0.55 : 1}
        pressStyle={{ backgroundColor: '$bgSubtle' }}
      >
        {busy ? (
          <Spinner size="small" color="$textMuted" />
        ) : (
          <UserMinus size={15} color={theme.textMuted?.val as string} />
        )}
        <Text color="$textMuted" fontSize={14} fontWeight="600">
          {t('friends.remove')}
        </Text>
      </XStack>
    </XStack>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <View flex={1} alignItems="center" justifyContent="center" padding="$5">
      <Text color="$textMuted" fontSize={15} textAlign="center">
        {text}
      </Text>
    </View>
  );
}
