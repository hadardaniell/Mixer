import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, YStack } from 'tamagui';

import { useExtractionJob } from '@/features/recipe/context/ExtractionJobContext';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { ensureNotifyPermission } from '@/shared/lib/localNotify';
import { isRTL } from '@/shared/lib/i18n';
import { CookingPot } from '@/shared/ui/CookingPot';
import { PrimaryButton } from '@/shared/ui/PrimaryButton';

/**
 * What you look at while a recipe is being extracted.
 *
 * It owns none of the work — the job runs in `ExtractionJobProvider`, above the
 * router — so this screen is free to be left. Staying means landing on the recipe the
 * moment it exists; leaving means getting a banner (and a device notification) later.
 * That's the whole point of the screen: waiting is optional.
 */
export function CookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRtl = isRTL(language);
  const { job, clear, setWatching } = useExtractionJob();
  const [leaving, setLeaving] = useState(false);
  // True once this screen has had a job to show. It separates "arrived with nothing
  // to wait for" from "the job we were showing was just cleared on the way out" —
  // the second must not trigger the redirect below, or it fights the navigation
  // already under way.
  const hadJob = useRef(false);

  // Tell the provider someone is here, so a job that finishes now navigates instead of
  // raising a banner. Cleared on unmount, including when the user walks away.
  useEffect(() => {
    setWatching(true);
    return () => setWatching(false);
  }, [setWatching]);

  useEffect(() => {
    if (job) hadJob.current = true;
  }, [job]);

  // Landing here with no job at all — back navigation into a screen the stack still
  // remembers, a cold deep link, a reload on web — used to render the pot and the
  // blinking dots forever, because "no job" was indistinguishable from "running".
  // Nothing will ever resolve, so don't pretend to be working: go home.
  useEffect(() => {
    if (job || hadJob.current) return;
    router.replace('/home');
  }, [job, router]);

  // Land on the recipe as soon as it exists. `leaving` guards the race where the user
  // taps "let me out" in the same tick the job resolves — their choice wins.
  useEffect(() => {
    if (leaving || job?.status !== 'ready' || !job.recipe) return;
    const recipeId = job.recipe.id;
    clear();
    router.replace('/home');
    setTimeout(() => router.push(`/recipes/${recipeId}` as never), 0);
  }, [job, leaving, clear, router]);

  const leave = async () => {
    setLeaving(true);
    setWatching(false);
    // The one moment asking for notification permission is fair: they just chose to be
    // told later. A refusal is fine — the in-app banner still works.
    await ensureNotifyPermission();
    router.replace('/home');
  };

  const failed = job?.status === 'failed';

  // Render nothing rather than a pot that isn't cooking anything. Covers both the
  // redirect above and the instant between `clear()` and the navigation landing.
  if (!job) return null;

  return (
    <YStack
      flex={1}
      backgroundColor="$bg"
      paddingHorizontal="$5"
      paddingTop={insets.top + 24}
      paddingBottom={insets.bottom + 24}
      alignItems="center"
      justifyContent="center"
      gap="$4"
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      <CookingPot size={220} />

      <YStack alignItems="center" gap="$2">
        <Text fontSize={22} fontWeight="700" letterSpacing={-0.6} color="$text" textAlign="center">
          {failed ? t('cooking.failed.title') : t('cooking.title')}
          {failed ? null : <BlinkingDots />}
        </Text>
        <Text fontSize={13.5} color="$textMuted" textAlign="center" maxWidth={300}>
          {failed
            ? t(job.error?.key ?? 'newRecipe.errors.extractFailed', job.error?.params)
            : t('cooking.subtitle')}
        </Text>
      </YStack>

      {failed ? (
        <YStack width="100%" maxWidth={320} gap="$2">
          <PrimaryButton
            label={t('cooking.failed.back')}
            onPress={() => {
              // Navigate first: clearing while still mounted is what made the
              // screen flash back to "cooking…" on the way out.
              if (router.canGoBack()) router.back();
              else router.replace('/new-recipe');
              clear();
            }}
          />
        </YStack>
      ) : (
        <Pressable onPress={() => void leave()} accessibilityRole="button" hitSlop={8}>
          <Text fontSize={13} fontWeight="700" color="$linkText" paddingVertical="$2">
            {t('cooking.leave')}
          </Text>
        </Pressable>
      )}
    </YStack>
  );
}

/**
 * Only the dots move — the sentence itself must not shift, or the whole line jitters
 * sideways on every beat. They live in a fixed-width box for exactly that reason, and
 * each one is a separate character so nothing re-lays-out as they come and go.
 */
function BlinkingDots() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCount((c) => (c + 1) % 4), 450);
    return () => clearInterval(id);
  }, []);

  return (
    <Text fontSize={22} fontWeight="700" color="$text">
      {'·'.repeat(count)}
      {/* Zero-width padding keeps the reserved width constant without a visible glyph. */}
      <Text opacity={0}>{'·'.repeat(3 - count)}</Text>
    </Text>
  );
}
