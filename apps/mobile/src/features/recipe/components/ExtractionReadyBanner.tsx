import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useExtractionJob } from '@/features/recipe/context/ExtractionJobContext';
import { MixerXMark } from '@/shared/ui/MixerXMark';

/** How long the banner stays before it retires itself. */
const DWELL_MS = 9000;

/**
 * "Your recipe is ready", dropped in from the top of whatever screen you're on.
 *
 * Mounted once at the root, above the router, because the whole point is that it can
 * reach the user wherever they wandered off to. It only appears for a job flagged
 * `announce` — one that finished while nobody was watching the cooking screen. Finish
 * with the screen open and you get taken to the recipe instead, which beats being told
 * about something already in front of you.
 *
 * The three touch targets are siblings, never nested: on web a `<button>` inside a
 * `<button>` is invalid DOM and React says so out loud.
 */
export function ExtractionReadyBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { job, clear } = useExtractionJob();

  const show = job?.status === 'ready' && !!job.recipe && job.announce === true;

  // Retire on its own. A banner that waits forever becomes furniture.
  useEffect(() => {
    if (!show) return;
    const id = setTimeout(clear, DWELL_MS);
    return () => clearTimeout(id);
  }, [show, clear]);

  if (!show || !job?.recipe) return null;

  const recipeId = job.recipe.id;
  const open = () => {
    clear();
    router.push(`/recipes/${recipeId}` as never);
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(260)}
      exiting={FadeOutUp.duration(200)}
      style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, zIndex: 1000 }}
    >
      <XStack
        alignItems="center"
        gap="$2"
        backgroundColor="$surface"
        borderRadius={18}
        paddingVertical="$2"
        paddingHorizontal="$3"
        shadowColor="black"
        shadowOpacity={0.28}
        shadowRadius={16}
        shadowOffset={{ width: 0, height: 8 }}
        elevation={12}
      >
        {/* Body — tapping anywhere on the text opens the recipe too. */}
        <Pressable onPress={open} accessibilityRole="button" style={{ flex: 1 }}>
          <XStack alignItems="center" gap="$3">
            {/* The x on white, the way the mark reads on the splash. It's a graphic,
                not text, which is the one job $primary is allowed to do. */}
            <YStack
              width={40}
              height={40}
              borderRadius={12}
              backgroundColor="$surface"
              borderWidth={1}
              borderColor="$border"
              alignItems="center"
              justifyContent="center"
            >
              <MixerXMark size={22} color="$primary" />
            </YStack>

            <YStack flex={1} gap={1}>
              <Text fontSize={14} fontWeight="700" color="$text" numberOfLines={1}>
                {t('cooking.ready.title')}
              </Text>
              <Text fontSize={12} color="$textMuted" numberOfLines={1}>
                {t('cooking.ready.body', { title: job.recipe.title })}
              </Text>
            </YStack>
          </XStack>
        </Pressable>

        {/* The explicit way in. Same ink pill as every other primary action. */}
        <Pressable onPress={open} accessibilityRole="button" hitSlop={6}>
          <YStack
            backgroundColor="$buttonPrimaryBg"
            borderRadius={999}
            paddingVertical={7}
            paddingHorizontal={14}
            pressStyle={{ opacity: 0.85 }}
          >
            <Text fontSize={12.5} fontWeight="700" color="$buttonPrimaryText">
              {t('cooking.ready.open')}
            </Text>
          </YStack>
        </Pressable>

        <Pressable
          onPress={clear}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={10}
        >
          <X size={18} color={theme.textMuted?.val as string} />
        </Pressable>
      </XStack>
    </Animated.View>
  );
}
