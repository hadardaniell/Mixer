import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import { Text, useTheme, View, XStack } from 'tamagui';

import type { UserSearchResult } from '@/features/friends/api/friendsApi';
import { buttonActionFor } from '@/features/friends/hooks/useFriendActions';
import { useIsRtl } from '@/shared/lib/useIsRtl';

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase() || '?';
}

interface AddFriendRowProps {
  user: UserSearchResult;
  busy?: boolean;
  onSend: (userId: string) => void;
  onCancel: (userId: string) => void;
  onAccept: (userId: string) => void;
}

export function AddFriendRow({ user, busy = false, onSend, onCancel, onAccept }: AddFriendRowProps) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const textAlign = isRtl ? 'right' : 'left';

  const action = buttonActionFor(user.friendshipStatus, user.isRequester);

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
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text color="$primary" fontSize={17} fontWeight="700">
            {initials(user.displayName)}
          </Text>
        )}
      </View>

      <Text flex={1} color="$text" fontSize={15} fontWeight="600" numberOfLines={1} textAlign={textAlign}>
        {user.displayName ?? ''}
      </Text>

      <RowButton
        action={action}
        busy={busy}
        label={{
          send: t('friends.send'),
          cancel: t('friends.requested'),
          accept: t('friends.accept'),
          friends: t('friends.friends'),
        }}
        onPress={() => {
          if (busy) return;
          if (action === 'send') onSend(user.id);
          else if (action === 'cancel') onCancel(user.id);
          else if (action === 'accept') onAccept(user.id);
        }}
      />
    </XStack>
  );
}

type Action = ReturnType<typeof buttonActionFor>;

function RowButton({
  action,
  busy,
  label,
  onPress,
}: {
  action: Action;
  busy: boolean;
  label: { send: string; cancel: string; accept: string; friends: string };
  onPress: () => void;
}) {
  const theme = useTheme();

  // Accepted (or self) -> a non-interactive "friends" pill with a check.
  if (action === 'none') {
    return (
      <XStack
        alignItems="center"
        gap="$1"
        paddingHorizontal="$3"
        height={36}
        borderRadius={999}
        backgroundColor="$accentLavender"
      >
        <Check size={15} color={theme.primary?.val as string} />
        <Text color="$primary" fontSize={14} fontWeight="600">
          {label.friends}
        </Text>
      </XStack>
    );
  }

  const primary = action === 'send' || action === 'accept';
  const text = action === 'send' ? label.send : action === 'accept' ? label.accept : label.cancel;

  return (
    <XStack
      onPress={onPress}
      disabled={busy}
      alignItems="center"
      justifyContent="center"
      minWidth={96}
      paddingHorizontal="$3"
      height={36}
      borderRadius={999}
      backgroundColor={primary ? '$primary' : '$surface'}
      borderWidth={primary ? 0 : 1}
      borderColor="$border"
      opacity={busy ? 0.55 : 1}
      pressStyle={primary ? { backgroundColor: '$buttonPrimaryBgHover' } : { backgroundColor: '$bgSubtle' }}
    >
      <Text color={primary ? 'white' : '$text'} fontSize={14} fontWeight="600">
        {text}
      </Text>
    </XStack>
  );
}
