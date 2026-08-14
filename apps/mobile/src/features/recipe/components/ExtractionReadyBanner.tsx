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
 * How a finished import announces itself, dropped in from the top of whatever screen
 * you're on — "your recipe is ready", or that it failed.
 *
 * Mounted once at the root, above the router, because the whole point is that it can
 * reach the user wherever they wandered off to. It only appears for a job flagged
 * `announce` — one that settled while nobody was watching the cooking screen. Settle
 * with the screen open and it handles the outcome itself (navigating to the recipe, or
 * showing the failure in place), which beats being told about what's in front of you.
 *
 * Both outcomes travel: a failure that stayed silent left the user waiting for a
 * recipe that was never created.
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

  const announced = job?.announce === true;
  const isReady = job?.status === 'ready' && !!job.recipe && announced;
  const isFailed = job?.status === 'failed' && announced;
  const show = isReady || isFailed;

  // Retire on its own. A banner that waits forever becomes furniture.
  useEffect(() => {
    if (!show) return;
    const id = setTimeout(clear, DWELL_MS);
    return () => clearTimeout(id);
  }, [show, clear]);

  if (!show || !job) return null;

  const title = isFailed ? t('cooking.failed.title') : t('cooking.ready.title');
  const body = isFailed
    ? t(job.error?.key ?? 'newRecipe.errors.extractFailed', job.error?.params)
    : t('cooking.ready.body', { title: job.recipe?.title });
  const actionLabel = isFailed ? t('cooking.failed.retry') : t('cooking.ready.open');

  // Success opens what was made; failure offers the only useful next move — going
  // back to the import screen to try again.
  const recipeId = job.recipe?.id;
  const open = () => {
    clear();
    router.push((isFailed ? '/new-recipe' : `/recipes/${recipeId}`) as never);
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
              {/* Same mark either way — a failure greys it out rather than
                  introducing a second colour just to say "bad". */}
              <MixerXMark size={22} color={isFailed ? '$textSubtle' : '$primary'} />
            </YStack>

            <YStack flex={1} gap={1}>
              <Text fontSize={14} fontWeight="700" color="$text" numberOfLines={1}>
                {title}
              </Text>
              <Text fontSize={12} color="$textMuted" numberOfLines={2}>
                {body}
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
              {actionLabel}
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
