//apps/mobile/src/features/book/components/BookMembersSheet.tsx
import { LogOut, Plus, UserMinus } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { Sheet } from '@/shared/ui/Sheet';

import type { BookMember } from '../hooks/useBookMembers';
import { MemberAvatar } from './MemberAvatar';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: BookMember[];
  isOwner: boolean;
  busy: boolean;
  onAddMembers: () => void;
  onChangeRole: (userId: string, role: 'editor' | 'viewer') => void;
  onRemoveMember: (member: BookMember) => void;
  onLeave: () => void;
}

/**
 * The book's member list. The owner can flip a member between editor and viewer
 * (tapping the role pill) or remove them; everyone else sees a read-only list
 * plus a "leave book" action for themselves.
 */
export function BookMembersSheet({
  open,
  onOpenChange,
  members,
  isOwner,
  busy,
  onAddMembers,
  onChangeRole,
  onRemoveMember,
  onLeave,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [pendingRemove, setPendingRemove] = useState<BookMember | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[72]}>
        <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
          {t('book.members.title')}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$1" paddingBottom="$4" opacity={busy ? 0.6 : 1}>
            {members.map((m) => (
              <XStack key={m.userId} alignItems="center" gap="$3" paddingVertical="$2">
                <MemberAvatar displayName={m.displayName} avatarUrl={m.avatarUrl} size={44} />

                <Text flex={1} color="$text" fontSize={15} fontWeight="600" numberOfLines={1}>
                  {m.isMe ? t('book.members.you', { name: m.displayName }) : m.displayName}
                </Text>

                {m.status === 'pending' ? (
                  <RolePill role="pending" label={t('book.members.pending')} />
                ) : (
                  <RolePill
                    role={m.role}
                    label={t(`book.roles.${m.role}`)}
                    // Only the owner changes roles, and the owner's own role is fixed.
                    onPress={
                      isOwner && m.role !== 'owner'
                        ? () => onChangeRole(m.userId, m.role === 'editor' ? 'viewer' : 'editor')
                        : undefined
                    }
                  />
                )}

                {isOwner && m.role !== 'owner' ? (
                  <YStack
                     onPress={() => {
                      setPendingRemove(m);
                      onOpenChange(false);
                    }}
                    hitSlop={8}
                    pressStyle={{ opacity: 0.7 }}
                    accessibilityRole="button"
                  >
                    <UserMinus size={20} color={theme.danger?.val as string} />
                  </YStack>
                ) : null}
              </XStack>
            ))}

            {isOwner ? (
              <XStack
                onPress={onAddMembers}
                alignItems="center"
                gap="$3"
                paddingVertical="$3"
                pressStyle={{ opacity: 0.7 }}
              >
                <YStack
                  width={44}
                  height={44}
                  borderRadius={999}
                  backgroundColor="$accentLavender"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Plus size={22} color={theme.primary?.val as string} strokeWidth={2.5} />
                </YStack>
                <Text color="$primary" fontSize={15} fontWeight="600">
                  {t('book.addMembers')}
                </Text>
              </XStack>
            ) : (
              <XStack
                onPress={() => {
                  setLeaveOpen(true);
                  onOpenChange(false);
                }}
                alignItems="center"
                gap="$3"
                paddingVertical="$3"
                pressStyle={{ opacity: 0.7 }}
              >
                <YStack
                  width={44}
                  height={44}
                  borderRadius={999}
                  backgroundColor="$accentPink"
                  alignItems="center"
                  justifyContent="center"
                >
                  <LogOut size={20} color={theme.danger?.val as string} />
                </YStack>
                <Text color="$danger" fontSize={15} fontWeight="600">
                  {t('book.leave')}
                </Text>
              </XStack>
            )}
          </YStack>
        </ScrollView>
      </Sheet>

      <ConfirmDialog
          open={pendingRemove !== null}
          title={t('book.members.removeTitle')}
          message={t('book.members.removeMessage', { name: pendingRemove?.displayName ?? '' })}
          confirmLabel={t('book.members.removeConfirm')}
          cancelLabel={t('common.cancel')}
          destructive
          onConfirm={() => {
            if (pendingRemove) onRemoveMember(pendingRemove);
            setPendingRemove(null);
            onOpenChange(true);
          }}
           onCancel={() => {
            setPendingRemove(null);
            onOpenChange(true);
          }}
        />

        <ConfirmDialog
          open={leaveOpen}
          title={t('book.leaveTitle')}
          message={t('book.leaveMessage')}
          confirmLabel={t('book.leaveConfirm')}
          cancelLabel={t('common.cancel')}
          destructive
          onConfirm={() => {
            setLeaveOpen(false);
            onLeave();
          }}
          onCancel={() => {
            setLeaveOpen(false);
            onOpenChange(true);
          }}
        />
    </>
  );
}

function RolePill({
  role,
  label,
  onPress,
}: {
  role: 'owner' | 'editor' | 'viewer' | 'pending';
  label: string;
  onPress?: () => void;
}) {
  const interactive = !!onPress;
  const bg =
    role === 'owner' ? '$accentLime' : role === 'pending' ? '$bgSubtle' : '$accentLavender';
  const color = role === 'owner' ? '$text' : role === 'pending' ? '$textMuted' : '$primary';
  return (
    <XStack
      onPress={onPress}
      disabled={!interactive}
      alignItems="center"
      justifyContent="center"
      height={30}
      paddingHorizontal={12}
      borderRadius={999}
      backgroundColor={bg}
      borderWidth={interactive ? 1 : 0}
      borderColor="$primary"
      pressStyle={interactive ? { opacity: 0.8 } : undefined}
    >
      <Text color={color} fontSize={13} fontWeight="600">
        {label}
      </Text>
    </XStack>
  );
}
