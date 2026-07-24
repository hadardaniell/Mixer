import type { PublicUser } from '@mixer/contracts';
import { Camera, Settings, UserPlus, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { initials } from '@/features/profile/lib/initials';
import { CountUp } from '@/shared/ui/CountUp';

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
  const brand = theme.textOnPrimary?.val as string;
  const avatarSrc = avatarPreview ?? user?.avatarUrl;

  return (
    <YStack gap="$4" alignItems="center">
      {/* Action bar — forced LTR so settings stays on the left in every language.
          Sits over the banner (rendered full-bleed by the screen); buttons are
          translucent so the wash shows through. */}
      <XStack
        width="100%"
        justifyContent="space-between"
        alignItems="center"
        style={{ direction: 'ltr' } as never}
      >
        <IconButton icon={Settings} color={ink} onPress={onSettings} />
        {isSelf ? <IconButton icon={UserPlus} color={ink} onPress={onAddFriends} /> : null}
      </XStack>

      {/* Avatar on a brand tint (not plain grey), with the camera badge. */}
      <View width={104} height={104} alignItems="center" justifyContent="center">
        <View
          width={100}
          height={100}
          borderRadius={999}
          overflow="hidden"
          backgroundColor="$primarySubtle"
          borderWidth={3}
          borderColor="$surface"
          alignItems="center"
          justifyContent="center"
        >
          {avatarSrc ? (
            <Image source={{ uri: avatarSrc }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text color="$textOnPrimary" fontSize={34} fontWeight="700">
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
              backgroundColor="$primarySubtle"
              opacity={0.7}
            >
              <ActivityIndicator color={brand} />
            </View>
          ) : null}
        </View>

        {/* Camera badge — the only entry point for changing the photo. */}
        {isSelf ? (
          <YStack
            onPress={onChangeAvatar}
            position="absolute"
            bottom={0}
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
            shadowOpacity={0.12}
            shadowRadius={8}
            shadowOffset={{ width: 0, height: 3 }}
            elevation={3}
            pressStyle={{ opacity: 0.85 }}
            accessibilityRole="button"
            accessibilityLabel={t('profile.changePhoto')}
          >
            <Camera size={17} color={ink} strokeWidth={1.9} />
          </YStack>
        ) : null}
      </View>

      <Text fontSize={24} fontWeight="700" letterSpacing={-0.5} color="$text">
        {user?.displayName ?? ''}
      </Text>

      {/* Stats — recipes / books / friends, counting up on entry. */}
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
      <CountUp value={value} fontSize={22} fontWeight="700" color="$text" />
      <Text fontSize={13} color="$textMuted">
        {label}
      </Text>
    </YStack>
  );
}

function Divider() {
  return <View width={1} height={32} backgroundColor="$border" />;
}

/** Plain surface icon tile — no accent blob (that pattern is retired), slightly
 *  translucent so the banner wash shows through. */
function IconButton({
  icon: Icon,
  color,
  onPress,
}: {
  icon: LucideIcon;
  color: string;
  onPress: () => void;
}) {
  return (
    <YStack
      onPress={onPress}
      width={40}
      height={40}
      borderRadius={13}
      backgroundColor="$surface"
      opacity={0.85}
      alignItems="center"
      justifyContent="center"
      shadowColor="black"
      shadowOpacity={0.06}
      shadowRadius={10}
      shadowOffset={{ width: 0, height: 3 }}
      elevation={2}
      pressStyle={{ opacity: 0.7 }}
    >
      <Icon size={20} color={color} strokeWidth={1.9} />
    </YStack>
  );
}
