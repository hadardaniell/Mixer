import { Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
import { Spinner, Text, View, YStack } from 'tamagui';

import { AddFriendRow } from '@/features/friends/components/AddFriendRow';
import type { MatchedContact } from '@/features/friends/api/friendsApi';
import { useContactsSync } from '@/features/friends/hooks/useContactsSync';
import { useFriendActions } from '@/features/friends/hooks/useFriendActions';
import { useIsRtl } from '@/shared/lib/useIsRtl';
import { ConceptualIcon } from '@/shared/ui/ConceptualIcon';

/**
 * What the add-friends screen shows before the user searches: the "Contacts on
 * Mixer" flow. A prompt to connect contacts, then the matched registered users
 * as ordinary add-friend rows.
 */
export function ContactsEmptyState() {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const { status, matches, sync } = useContactsSync();
  const { sendRequest, cancelRequest, acceptRequest } = useFriendActions();

  const busy =
    sendRequest.isPending || cancelRequest.isPending || acceptRequest.isPending;

  if (status === 'loading' || status === 'requesting') {
    return (
      <View flex={1} alignItems="center" justifyContent="center" gap="$3">
        <Spinner color="$primary" />
        <Text color="$textMuted" fontSize={13}>
          {t('friends.contacts.loading')}
        </Text>
      </View>
    );
  }

  // Matched contacts → a titled list of add-friend rows.
  if (status === 'ready' && matches.length > 0) {
    return (
      <FlatList<MatchedContact>
        data={matches}
        keyExtractor={(u) => u.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <Text
            color="$textMuted"
            fontSize={12}
            fontWeight="700"
            letterSpacing={1.2}
            paddingHorizontal="$4"
            paddingTop="$2"
            paddingBottom="$1"
            textAlign={isRtl ? 'right' : 'left'}
          >
            {t('friends.contacts.sectionTitle')}
          </Text>
        }
        renderItem={({ item }) => (
          <AddFriendRow
            user={item}
            busy={busy}
            onSend={(id) => sendRequest.mutate(id)}
            onCancel={(id) => cancelRequest.mutate(id)}
            onAccept={(id) => acceptRequest.mutate(id)}
          />
        )}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  // Prompt / denied / empty-match / error all share the centered card shape.
  const denied = status === 'denied';
  const noMatches = status === 'ready' && matches.length === 0;
  const errored = status === 'error';

  const title = denied
    ? t('friends.contacts.deniedTitle')
    : noMatches
      ? t('friends.contacts.noMatchesTitle')
      : errored
        ? t('friends.contacts.errorTitle')
        : t('friends.contacts.promptTitle');

  const subtitle = denied
    ? t('friends.contacts.deniedSubtitle')
    : noMatches
      ? t('friends.contacts.noMatchesSubtitle')
      : errored
        ? t('friends.contacts.errorSubtitle')
        : t('friends.contacts.promptSubtitle');

  // Show the connect button on the initial prompt and after an error (retry).
  const showButton = status === 'idle' || errored;

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$5" gap="$3">
      <ConceptualIcon Icon={Users} blobColor="$accentMint" variant={1} size={92} />
      <Text color="$text" fontSize={16} fontWeight="700" textAlign="center">
        {title}
      </Text>
      <Text color="$textMuted" fontSize={13} textAlign="center" maxWidth={280} lineHeight={19}>
        {subtitle}
      </Text>

      {showButton ? (
        <YStack
          onPress={sync}
          marginTop="$2"
          height={48}
          paddingHorizontal={22}
          borderRadius={999}
          backgroundColor="$buttonPrimaryBg"
          alignItems="center"
          justifyContent="center"
          pressStyle={{ backgroundColor: '$buttonPrimaryBgHover' }}
        >
          <Text color="$buttonPrimaryText" fontSize={15} fontWeight="700">
            {t('friends.contacts.connect')}
          </Text>
        </YStack>
      ) : null}
    </YStack>
  );
}
