import { Asset } from 'expo-asset';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, YStack } from 'tamagui';

// Resolved once: a bundler URL for the hero clip (works on web via <video>).
const HERO_VIDEO_URI = Asset.fromModule(
  require('../src/assets/videos/mix soicials create recipe.mp4'),
).uri;

export default function StartScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Ensure the clip plays on mount even if the browser ignores the autoPlay
  // attribute (it's muted, so this is allowed without a user gesture).
  useEffect(() => {
    videoRef.current?.play?.().catch(() => {});
  }, []);

  return (
    <YStack
      flex={1}
      backgroundColor="$bg"
      paddingHorizontal="$5"
      paddingTop={insets.top + 24}
      paddingBottom={insets.bottom + 24}
      justifyContent="space-between"
      alignItems="center"
    >
      {/* Hero clip — autoplays muted on loop, GIF-style. */}
      <YStack flex={1} width="100%" alignItems="center" justifyContent="center" gap="$4">
        <YStack
          width="100%"
          aspectRatio={1}
          maxWidth={340}
          borderRadius={28}
          overflow="hidden"
          alignItems="center"
          justifyContent="center"
        >
          <Image
            source={require('../src/assets/images/recpie flow 4.jpeg')}
            resizeMode="contain"
            style={{ width: '100%', height: '100%' }}
          />
          {/* {Platform.OS === 'web' ? (
            <video
              ref={videoRef}
              src={HERO_VIDEO_URI}
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '113%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
              }}
            />
          ) : (
            // Native needs a real player (expo-video); placeholder until wired.
            <Text fontSize="$6" fontWeight="700" color="$primary">
              GIF
            </Text>
          )} */}
        </YStack>

        <Text fontSize="$6" fontWeight="700" color="$text" textAlign="center">
          {t('start.tagline')}
        </Text>
      </YStack>

      {/* Login (secondary) on top, Register (primary) below — full-width column */}
      <YStack width="100%" gap="$3">
        <ActionButton variant="secondary" onPress={() => router.push('/login')}>
          {t('start.login')}
        </ActionButton>
        <ActionButton variant="primary" onPress={() => router.push('/register')}>
          {t('start.register')}
        </ActionButton>
      </YStack>
    </YStack>
  );
}

function ActionButton({
  variant,
  onPress,
  children,
}: {
  variant: 'primary' | 'secondary';
  onPress: () => void;
  children: string;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ width: '100%' }}>
      <YStack
        width="100%"
        height={52}
        borderRadius={20}
        alignItems="center"
        justifyContent="center"
        backgroundColor={isPrimary ? '$buttonPrimaryBg' : '$surface'}
        borderWidth={isPrimary ? 0 : 1}
        borderColor="$border"
        shadowColor={isPrimary ? '$primary' : 'black'}
        shadowOpacity={isPrimary ? 0.35 : 0.05}
        shadowOffset={{ width: 0, height: isPrimary ? 8 : 4 }}
        shadowRadius={isPrimary ? 16 : 8}
        elevation={isPrimary ? 6 : 1}
        pressStyle={{
          backgroundColor: isPrimary ? '$buttonPrimaryBgHover' : '$bgSubtle',
        }}
      >
        <Text
          fontSize="$5"
          fontWeight="700"
          color={isPrimary ? '$textOnPrimary' : '$text'}
        >
          {children}
        </Text>
      </YStack>
    </Pressable>
  );
}
