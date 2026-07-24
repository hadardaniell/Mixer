import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Text, useTheme, View, YStack } from 'tamagui';

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
      {/* Two small periwinkle glows in opposite corners — the only color on the
          canvas, kept faint so the motion carries the screen, not the surface. */}
      <AmbientGlow />

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

/** Full-bleed periwinkle radial glows, faded to transparent. `react-native-svg`
 *  can't read Tamagui tokens, so the brand hex is resolved from the theme. */
function AmbientGlow() {
  const theme = useTheme();
  const periwinkle = theme.primary?.val as string;

  return (
    <View position="absolute" top={0} left={0} right={0} bottom={0} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glowTop" cx="12%" cy="10%" r="42%">
            <Stop offset="0" stopColor={periwinkle} stopOpacity={0.15} />
            <Stop offset="1" stopColor={periwinkle} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowBottom" cx="90%" cy="94%" r="40%">
            <Stop offset="0" stopColor={periwinkle} stopOpacity={0.12} />
            <Stop offset="1" stopColor={periwinkle} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowTop)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowBottom)" />
      </Svg>
    </View>
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
