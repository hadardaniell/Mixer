import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, YStack } from 'tamagui';

import { StartMixerScene } from '@/features/auth/components/StartMixerScene';
import { PrimaryButton } from '@/shared/ui/PrimaryButton';

export default function StartScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <YStack
      flex={1}
      backgroundColor="$bg"
      paddingHorizontal="$5"
      paddingTop={insets.top + 24}
      paddingBottom={insets.bottom + 24}
    >
      <YStack flex={1} justifyContent="space-between">
        {/* Hero: the mixer animation, tagline beneath it */}
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$5">
          <StartMixerScene />
          <Text
            fontSize={22}
            fontWeight="700"
            color="$text"
            textAlign="center"
            letterSpacing={-0.4}
          >
            {t('start.tagline')}
          </Text>
        </YStack>

        {/* Login (secondary) on top, Register (primary ink) below */}
        <YStack width="100%" gap="$3">
          <SecondaryButton onPress={() => router.push('/login')}>
            {t('start.login')}
          </SecondaryButton>
          <PrimaryButton label={t('start.register')} onPress={() => router.push('/register')} />
        </YStack>
      </YStack>
    </YStack>
  );
}

/** The one secondary look: white surface, hairline border, ink label. */
function SecondaryButton({ onPress, children }: { onPress: () => void; children: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ width: '100%' }}>
      <YStack
        width="100%"
        height={54}
        borderRadius={20}
        alignItems="center"
        justifyContent="center"
        backgroundColor="$surface"
        borderWidth={1}
        borderColor="$border"
        pressStyle={{ backgroundColor: '$bgSubtle' }}
      >
        <Text fontSize={18} fontWeight="700" color="$text">
          {children}
        </Text>
      </YStack>
    </Pressable>
  );
}
