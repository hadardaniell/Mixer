import type { PublicUser } from '@mixer/contracts';
import { Pencil, Settings, UserPlus, type LucideIcon } from 'lucide-react-native';
import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

interface ProfileHeaderProps {
  user: PublicUser | null;
  isSelf: boolean;
  stats: { recipes: number; books: number; friends: number };
  onSettings: () => void;
  onEditProfile: () => void;
  onAddFriends: () => void;
}

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase() || '?';
}

export function ProfileHeader({
  user,
  isSelf,
  stats,
  onSettings,
  onEditProfile,
  onAddFriends,
}: ProfileHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const ink = theme.text?.val as string;

  return (
    <YStack gap="$4" alignItems="center">
      {/* Action bar — forced LTR so settings stays on the left in every language. */}
      <XStack
        width="100%"
        justifyContent="space-between"
        alignItems="center"
        style={{ direction: 'ltr' } as never}
      >
        <IconButton icon={Settings} accent="$accentLavender" color={ink} onPress={onSettings} />
        {isSelf ? (
          <IconButton icon={UserPlus} accent="$accentLime" color={ink} onPress={onAddFriends} />
        ) : null}
      </XStack>

      {/* Avatar with soft accent blob */}
      <View width={112} height={112} alignItems="center" justifyContent="center">
        <View
          position="absolute"
          width={44}
          height={44}
          borderRadius={22}
          backgroundColor="$accentLavender"
          bottom={4}
          left={0}
        />
        <View
          width={104}
          height={104}
          borderRadius={52}
          overflow="hidden"
          backgroundColor="$accentLavender"
          alignItems="center"
          justifyContent="center"
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text color="$primary" fontSize={36} fontWeight="700">
              {initials(user?.displayName)}
            </Text>
          )}
        </View>
      </View>

      <YStack gap="$1" alignItems="center">
        <Text fontSize={26} fontWeight="700" letterSpacing={-0.5} color="$text">
          {user?.displayName ?? ''}
        </Text>

      </YStack>

      {/* Stats — start→end: recipes, books, friends */}
      <XStack alignItems="center" gap="$4">
        <Stat value={stats.recipes} label={t('profile.stats.recipes')} />
        <Divider />
        <Stat value={stats.books} label={t('profile.stats.books')} />
        <Divider />
        <Stat value={stats.friends} label={t('profile.stats.friends')} />
      </XStack>

      {isSelf ? (
        <XStack
          onPress={onEditProfile}
          alignItems="center"
          gap="$2"
          paddingHorizontal="$4"
          paddingVertical="$2"
          borderRadius={999}
          backgroundColor="$surface"
          borderWidth={1}
          borderColor="$border"
          shadowColor="black"
          shadowOpacity={0.06}
          shadowRadius={12}
          shadowOffset={{ width: 0, height: 4 }}
          elevation={1}
          pressStyle={{ backgroundColor: '$bgSubtle' }}
        >
          <Pencil size={16} color={theme.primary?.val as string} />
          <Text fontSize={15} fontWeight="600" color="$text">
            {t('profile.editProfile')}
          </Text>
        </XStack>
      ) : null}
    </YStack>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <YStack alignItems="center" minWidth={56}>
      <Text fontSize={22} fontWeight="700" color="$text">
        {value}
      </Text>
      <Text fontSize={13} color="$textMuted">
        {label}
      </Text>
    </YStack>
  );
}

function Divider() {
  return <View width={1} height={32} backgroundColor="$border" />;
}

function IconButton({
  icon: Icon,
  accent,
  color,
  onPress,
}: {
  icon: LucideIcon;
  accent: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <YStack
      onPress={onPress}
      width={44}
      height={44}
      borderRadius={14}
      backgroundColor="$surface"
      alignItems="center"
      justifyContent="center"
      shadowColor="black"
      shadowOpacity={0.06}
      shadowRadius={12}
      shadowOffset={{ width: 0, height: 4 }}
      elevation={1}
      pressStyle={{ opacity: 0.85 }}
    >
      <View
        position="absolute"
        width={16}
        height={16}
        borderRadius={8}
        backgroundColor={accent}
        bottom={5}
        right={5}
      />
      <Icon size={20} color={color} />
    </YStack>
  );
}
