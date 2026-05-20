import { useTranslation } from 'react-i18next';
import { H1, Paragraph, XStack, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <YStack flex={1} padding="$4" gap="$4" alignItems="center">
      <YStack
        width={88}
        height={88}
        borderRadius={44}
        backgroundColor="$yellow8"
        alignItems="center"
        justifyContent="center"
      >
        <H1 color="white">{user?.name?.[0] ?? '?'}</H1>
      </YStack>

      <H1>{user?.name}</H1>

      <XStack gap="$5">
        <Stat value={6} label={t('profile.stats.books')} />
        <Stat value={14} label={t('profile.stats.recipes')} />
        <Stat value={12} label={t('profile.stats.friends')} />
      </XStack>
    </YStack>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <YStack alignItems="center">
      <Paragraph fontWeight="700" fontSize="$6">
        {value}
      </Paragraph>
      <Paragraph size="$2" color="$gray11">
        {label}
      </Paragraph>
    </YStack>
  );
}
