import { LogOut, Pencil, Trash2, Users, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { Sheet } from '@/shared/ui/Sheet';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  isOwner: boolean;
  onEdit: () => void;
  onManageMembers: () => void;
  onLeave: () => void;
  onDelete: () => void;
}

/**
 * The `⋮` menu. Entries mirror the server's rules: editing needs owner or
 * editor, deleting needs owner, and leaving is for everyone but the owner (who
 * can't leave a book they own).
 */
export function BookOverflowSheet({
  open,
  onOpenChange,
  canEdit,
  isOwner,
  onEdit,
  onManageMembers,
  onLeave,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[40]}>
      <YStack gap="$1">
        {canEdit ? (
          <Row Icon={Pencil} label={t('book.overflow.edit')} onPress={onEdit} />
        ) : null}

        <Row Icon={Users} label={t('book.overflow.members')} onPress={onManageMembers} />

        {isOwner ? (
          <Row
            Icon={Trash2}
            label={t('book.overflow.delete')}
            color={theme.danger?.val as string}
            onPress={onDelete}
          />
        ) : (
          <Row
            Icon={LogOut}
            label={t('book.leave')}
            color={theme.danger?.val as string}
            onPress={onLeave}
          />
        )}
      </YStack>
    </Sheet>
  );
}

function Row({
  Icon,
  label,
  color,
  onPress,
}: {
  Icon: LucideIcon;
  label: string;
  color?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const ink = color ?? (theme.text?.val as string);
  return (
    <XStack
      onPress={onPress}
      alignItems="center"
      gap="$3"
      paddingVertical="$3"
      paddingHorizontal="$2"
      borderRadius={14}
      pressStyle={{ backgroundColor: '$bgSubtle' }}
    >
      <Icon size={22} color={ink} />
      <Text color={ink} fontSize={16} fontWeight="600">
        {label}
      </Text>
    </XStack>
  );
}
