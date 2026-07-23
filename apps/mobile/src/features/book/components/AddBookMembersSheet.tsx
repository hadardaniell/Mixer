import { Check } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useFriends } from '@/features/friends/hooks/useFriends';
import { ManualTextInput } from '@/features/recipe/components/manual/ManualTextInput';
import { Sheet } from '@/shared/ui/Sheet';

import { MemberAvatar } from './MemberAvatar';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** User ids already in the book — filtered out of the pickable list. */
  existingMemberIds: string[];
  busy: boolean;
  onConfirm: (userIds: string[], role: 'editor' | 'viewer') => void;
}

/**
 * Friend picker for adding members. Selected friends become members
 * immediately — there's no invite/accept step — so the role toggle sits right
 * next to the confirm button. Editors can add and remove recipes; viewers can
 * only read.
 */
export function AddBookMembersSheet({
  open,
  onOpenChange,
  existingMemberIds,
  busy,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { friends, isLoading } = useFriends();

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');

  const existing = useMemo(() => new Set(existingMemberIds), [existingMemberIds]);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return friends
      .filter((f) => !existing.has(f.id))
      .filter((f) => !q || (f.displayName ?? '').toLowerCase().includes(q));
  }, [friends, existing, query]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const close = () => {
    setSelected(new Set());
    setQuery('');
    onOpenChange(false);
  };

  const confirm = () => {
    if (selected.size === 0 || busy) return;
    onConfirm([...selected], role);
    setSelected(new Set());
    setQuery('');
  };

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())} snapPoints={[80]}>
      <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
        {t('book.addMembersSheet.title')}
      </Text>

      <ManualTextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('book.addMembersSheet.searchPlaceholder')}
      />

      <XStack alignItems="center" gap="$2">
        <Text color="$textMuted" fontSize={13}>
          {t('book.addMembersSheet.roleLabel')}
        </Text>
        <RoleToggle value={role} onChange={setRole} />
      </XStack>

      {isLoading ? (
        <YStack paddingVertical="$6" alignItems="center">
          <ActivityIndicator color={theme.primary?.val as string} />
        </YStack>
      ) : candidates.length === 0 ? (
        <Text color="$textMuted" fontSize={14} textAlign="center" paddingVertical="$5">
          {friends.length === 0
            ? t('book.addMembersSheet.noFriends')
            : t('book.addMembersSheet.allAdded')}
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$1" paddingBottom="$3">
            {candidates.map((f) => {
              const isSelected = selected.has(f.id);
              return (
                <XStack
                  key={f.id}
                  onPress={() => toggle(f.id)}
                  alignItems="center"
                  gap="$3"
                  paddingVertical="$2"
                  paddingHorizontal="$2"
                  borderRadius={14}
                  backgroundColor={isSelected ? '$accentCloud' : 'transparent'}
                  pressStyle={{ backgroundColor: '$bgSubtle' }}
                >
                  <MemberAvatar
                    displayName={f.displayName ?? ''}
                    avatarUrl={f.avatarUrl ?? undefined}
                    size={44}
                  />
                  <Text flex={1} color="$text" fontSize={15} fontWeight="600" numberOfLines={1}>
                    {f.displayName ?? ''}
                  </Text>
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
                </XStack>
              );
            })}
          </YStack>
        </ScrollView>
      )}

      <YStack
        onPress={confirm}
        disabled={selected.size === 0 || busy}
        height={54}
        borderRadius={20}
        backgroundColor="$primary"
        alignItems="center"
        justifyContent="center"
        opacity={selected.size === 0 || busy ? 0.55 : 1}
        pressStyle={{ backgroundColor: '$buttonPrimaryBgHover' }}
      >
        <Text color="$textOnPrimary" fontSize={16} fontWeight="700">
          {busy
            ? t('book.addMembersSheet.adding')
            : t('book.addMembersSheet.confirm', { count: selected.size })}
        </Text>
      </YStack>
    </Sheet>
  );
}

function RoleToggle({
  value,
  onChange,
}: {
  value: 'editor' | 'viewer';
  onChange: (role: 'editor' | 'viewer') => void;
}) {
  const { t } = useTranslation();
  return (
    <XStack
      backgroundColor="$surface"
      borderWidth={1}
      borderColor="$border"
      borderRadius={999}
      padding={3}
      gap={2}
    >
      {(['editor', 'viewer'] as const).map((r) => {
        const active = value === r;
        return (
          <XStack
            key={r}
            onPress={() => onChange(r)}
            paddingHorizontal={14}
            paddingVertical={6}
            borderRadius={999}
            backgroundColor={active ? '$accentLavender' : 'transparent'}
            pressStyle={{ opacity: 0.8 }}
          >
            <Text color={active ? '$primary' : '$text'} fontSize={13} fontWeight="600">
              {t(`book.roles.${r}`)}
            </Text>
          </XStack>
        );
      })}
    </XStack>
  );
}
