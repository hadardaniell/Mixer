import type { PublicUser } from '@mixer/contracts';
import { Camera, Settings, UserPlus, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { initials } from '@/features/profile/lib/initials';

interface ProfileHeaderProps {
  user: PublicUser | null;
  isSelf: boolean;
  stats: { recipes: number; books: number; friends: number };
  /** Local uri of a just-picked avatar, shown before the upload resolves. */
  avatarPreview?: string | null;
  isUploadingAvatar?: boolean;
  onSettings: () => void;
  onChangeAvatar: () => void;
  onAddFriends: () => void;
  onFriends: () => void;
}

export function ProfileHeader({
  user,
  isSelf,
  stats,
  avatarPreview,
  isUploadingAvatar,
  onSettings,
  onChangeAvatar,
  onAddFriends,
  onFriends,
}: ProfileHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const ink = theme.text?.val as string;
  const avatarSrc = avatarPreview ?? user?.avatarUrl;

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

      {/* Avatar. On your own profile the camera badge takes the accent blob's spot. */}
      <View width={112} height={112} alignItems="center" justifyContent="center">
        {isSelf ? null : (
          <View
            position="absolute"
            width={44}
            height={44}
            borderRadius={22}
            backgroundColor="$accentLavender"
            bottom={4}
            left={0}
          />
        )}
        <View
          width={104}
          height={104}
          borderRadius={52}
          overflow="hidden"
          backgroundColor="$accentLavender"
          alignItems="center"
          justifyContent="center"
        >
          {avatarSrc ? (
            <Image source={{ uri: avatarSrc }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text color="$primary" fontSize={36} fontWeight="700">
              {initials(user?.displayName)}
            </Text>
          )}
          {isUploadingAvatar ? (
            <View
              position="absolute"
              width="100%"
              height="100%"
              alignItems="center"
              justifyContent="center"
              backgroundColor="$accentLavender"
              opacity={0.7}
            >
              <ActivityIndicator color={theme.primary?.val as string} />
            </View>
          ) : null}
        </View>

        {/* Camera badge — the only entry point for changing the photo. */}
        {isSelf ? (
          <YStack
            onPress={onChangeAvatar}
            position="absolute"
            bottom={4}
            // Physical left in both directions — it replaces the accent blob.
            left={0}
            width={34}
            height={34}
            borderRadius={999}
            backgroundColor="$surface"
            borderWidth={2}
            borderColor="$bg"
            alignItems="center"
            justifyContent="center"
            shadowColor="black"
            shadowOpacity={0.06}
            shadowRadius={12}
            shadowOffset={{ width: 0, height: 4 }}
            elevation={2}
            pressStyle={{ opacity: 0.85 }}
            accessibilityRole="button"
            accessibilityLabel={t('profile.changePhoto')}
          >
            <Camera size={17} color={theme.primary?.val as string} />
          </YStack>
        ) : null}
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
        <Stat value={stats.friends} label={t('profile.stats.friends')} onPress={onFriends} />
      </XStack>
    </YStack>
  );
}

function Stat({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress?: () => void;
}) {
  return (
    <YStack
      alignItems="center"
      minWidth={56}
      onPress={onPress}
      pressStyle={onPress ? { opacity: 0.6 } : undefined}
    >
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
