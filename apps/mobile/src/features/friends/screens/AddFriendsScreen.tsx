import { router } from 'expo-router';
import { ArrowRight, Search, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Platform, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner, Text, useTheme, View, XStack, YStack } from 'tamagui';

import { AddFriendRow } from '@/features/friends/components/AddFriendRow';
import { ContactsEmptyState } from '@/features/friends/components/ContactsEmptyState';
import { useFriendActions } from '@/features/friends/hooks/useFriendActions';
import { useUserSearch } from '@/features/friends/hooks/useUserSearch';
import { useIsRtl } from '@/shared/lib/useIsRtl';

const INPUT_FONT = Platform.select({ web: 'Rubik', default: 'Rubik_400Regular' });

export function AddFriendsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isRtl = useIsRtl();
  const inputRef = useRef<TextInput>(null);
  const ink = theme.text?.val as string;
  const muted = theme.textMuted?.val as string;

  const [text, setText] = useState('');
  const { users, isLoading, isError, tooShort, query } = useUserSearch(text);
  const { sendRequest, cancelRequest, acceptRequest } = useFriendActions();

  const busy =
    sendRequest.isPending || cancelRequest.isPending || acceptRequest.isPending;

  const hasQuery = query.length >= 2;

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
          {t('friends.addTitle')}
        </Text>
      </XStack>

      <View paddingHorizontal="$4" paddingVertical="$2">
        <XStack
          alignItems="center"
          gap="$3"
          paddingHorizontal="$4"
          height={48}
          borderRadius={28}
          backgroundColor="$searchBarBg"
        >
          <Search size={20} color={muted} />
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder={t('friends.searchPlaceholder')}
            placeholderTextColor={muted}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            style={{
              flex: 1,
              fontFamily: INPUT_FONT,
              fontSize: 15,
              color: ink,
              paddingVertical: 0,
              textAlign: isRtl ? 'right' : 'left',
              outlineStyle: 'none',
            } as never}
          />
          {text.length > 0 ? (
            <Pressable onPress={() => setText('')} hitSlop={8} accessibilityRole="button">
              <X size={18} color={muted} />
            </Pressable>
          ) : null}
        </XStack>
      </View>

      {isLoading ? (
        <View flex={1} alignItems="center" justifyContent="center">
          <Spinner color="$primary" />
        </View>
      ) : isError ? (
        <Centered text={t('friends.error')} />
      ) : !hasQuery ? (
        // One char typed → nudge to keep going; otherwise the contacts flow.
        tooShort ? (
          <Centered text={t('friends.keepTyping')} />
        ) : (
          <ContactsEmptyState />
        )
      ) : users.length === 0 ? (
        <Centered text={t('friends.noResults', { query })} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          keyboardShouldPersistTaps="handled"
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
      )}
    </YStack>
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
