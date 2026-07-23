import type { ShareResourceType } from '@mixer/contracts';
import { Check } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { MemberAvatar } from '@/features/book/components/MemberAvatar';
import { useFriends } from '@/features/friends/hooks/useFriends';
import { ManualTextInput } from '@/features/recipe/components/manual/ManualTextInput';
import { Sheet } from '@/shared/ui/Sheet';

import { useAlreadySharedWith, useSendShare } from '../hooks/useSendShare';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: ShareResourceType;
  resourceId: string;
}

/**
 * Friend picker for sharing a recipe or book. Unlike book membership, a share is
 * a *request* — the friend gets a notification and can accept or reject it — so
 * the confirm copy talks about sending, not adding. Friends the resource is
 * already shared with stay listed but disabled, since the server 409s on a
 * duplicate.
 */
export function ShareSheet({ open, onOpenChange, resourceType, resourceId }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { friends, isLoading } = useFriends();
  const { friendIds: alreadyShared } = useAlreadySharedWith({ resourceType, resourceId }, open);
  const send = useSendShare();

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [failedCount, setFailedCount] = useState(0);

  // Reopening the sheet should never inherit the previous run's outcome.
  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setQuery('');
      setFailedCount(0);
      send.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return friends.filter((f) => !q || (f.displayName ?? '').toLowerCase().includes(q));
  }, [friends, query]);

  const toggle = (id: string) => {
    if (alreadyShared.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirm = () => {
    if (selected.size === 0 || send.isPending) return;
    send.mutate(
      { resourceType, resourceId, friendIds: [...selected] },
      {
        onSuccess: ({ failed }) => {
          setFailedCount(failed.length);
          // Everything landed — close. Otherwise keep the sheet up so the
          // partial-failure line is readable.
          if (failed.length === 0) onOpenChange(false);
          else setSelected(new Set(failed));
        },
      },
    );
  };

  const disabled = selected.size === 0 || send.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[80]}>
      <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
        {t('share.sheet.title')}
      </Text>
      <Text color="$textMuted" fontSize={13} textAlign="center">
        {t('share.sheet.subtitle')}
      </Text>

      <ManualTextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('share.sheet.searchPlaceholder')}
      />

      {isLoading ? (
        <YStack paddingVertical="$6" alignItems="center">
          <ActivityIndicator color={theme.primary?.val as string} />
        </YStack>
      ) : candidates.length === 0 ? (
        <Text color="$textMuted" fontSize={14} textAlign="center" paddingVertical="$5">
          {friends.length === 0 ? t('share.sheet.noFriends') : t('share.sheet.noMatches')}
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$1" paddingBottom="$3">
            {candidates.map((f) => {
              const isShared = alreadyShared.has(f.id);
              const isSelected = selected.has(f.id);
              return (
                <XStack
                  key={f.id}
                  onPress={() => toggle(f.id)}
                  accessibilityRole="button"
                  alignItems="center"
                  gap="$3"
                  paddingVertical="$2"
                  paddingHorizontal="$2"
                  borderRadius={14}
                  opacity={isShared ? 0.5 : 1}
                  backgroundColor={isSelected ? '$accentCloud' : 'transparent'}
                  pressStyle={isShared ? undefined : { backgroundColor: '$bgSubtle' }}
                >
                  <MemberAvatar
                    displayName={f.displayName ?? ''}
                    avatarUrl={f.avatarUrl ?? undefined}
                    size={44}
                  />
                  <Text flex={1} color="$text" fontSize={15} fontWeight="600" numberOfLines={1}>
                    {f.displayName ?? ''}
                  </Text>
                  {isShared ? (
                    <Text color="$textMuted" fontSize={12} fontWeight="600">
                      {t('share.sheet.alreadyShared')}
                    </Text>
                  ) : (
                    <YStack
                      width={24}
                      height={24}
                      borderRadius={999}
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor={isSelected ? '$buttonSecondaryBg' : 'transparent'}
                      borderWidth={isSelected ? 0 : 1.5}
                      borderColor="$border"
                    >
                      {isSelected ? (
                        // Lime needs dark ink on top — see `textOnSecondary`.
                        <Check
                          size={15}
                          color={theme.textOnSecondary?.val as string}
                          strokeWidth={3}
                        />
                      ) : null}
                    </YStack>
                  )}
                </XStack>
              );
            })}
          </YStack>
        </ScrollView>
      )}

      {send.isError ? (
        <Text color="$danger" fontSize={13} textAlign="center">
          {t('share.sheet.error')}
        </Text>
      ) : failedCount > 0 ? (
        <Text color="$danger" fontSize={13} textAlign="center">
          {t('share.sheet.partialError', { count: failedCount })}
        </Text>
      ) : null}

      <YStack
        onPress={confirm}
        disabled={disabled}
        height={54}
        borderRadius={20}
        backgroundColor="$buttonPrimaryBg"
        alignItems="center"
        justifyContent="center"
        opacity={disabled ? 0.55 : 1}
        pressStyle={{ backgroundColor: '$buttonPrimaryBgHover' }}
      >
        <Text color="$buttonPrimaryText" fontSize={16} fontWeight="700">
          {send.isPending
            ? t('share.sheet.sending')
            : t('share.sheet.confirm', { count: selected.size })}
        </Text>
      </YStack>
    </Sheet>
  );
}
