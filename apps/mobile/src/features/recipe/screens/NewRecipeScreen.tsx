import { useRouter } from 'expo-router';
import { Camera, ChevronLeft, ChevronRight, Link as LinkIcon, PencilLine, Type } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { DraftCard } from '@/features/recipe/components/DraftCard';
import { DraftsSkeleton } from '@/features/recipe/components/DraftsSkeleton';
import { useDrafts } from '@/features/recipe/hooks/useDrafts';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { isRTL } from '@/shared/lib/i18n';
import { BlobActionCard } from '@/shared/ui/BlobActionCard';

export function NewRecipeScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRtl = isRTL(language);
  const { data: drafts, isLoading: draftsLoading } = useDrafts(6);
  const theme = useTheme();

  const SeeAllChevron = () => {
    const Chevron = isRtl ? ChevronLeft : ChevronRight;
    return <Chevron size={15} color={theme.textMuted?.val as string} />;
  };

  return (
    <ScrollView
      style={{ flex: 1, width: '100%', height: '100%' }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 32, // ~2em above the safe area
        paddingBottom: 140,
      }}
      showsVerticalScrollIndicator={false}
    >
      <YStack
        flex={1}
        width="100%"
        paddingHorizontal="$4"
        gap="$4"
        style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
      >
        {/* Header — bell on the start side, centered title + subtitle */}
        {/* <YStack gap="$1">
          <XStack width="100%" justifyContent="flex-start">
            <Pressable accessibilityRole="button" hitSlop={8}>
              <Bell size={22} color={ink} />
            </Pressable>
          </XStack>
          <YStack alignItems="center" gap="$1" marginTop={-12}>
            <Text color="$text" fontSize={26} fontWeight="700" letterSpacing={-0.5}>
              {t('newRecipe.title')}
            </Text>
            <Text color="$textMuted" fontSize={15}>
              {t('newRecipe.subtitle')}
            </Text>
          </YStack>
        </YStack> */}

        {/* Plain title block, no card. Once the mark came out, a shadowed panel
            holding nothing but two lines of text was drawing attention to
            itself for no reason — the four action tiles below are the content
            of this screen. */}
        <YStack gap="$2" paddingTop="$2">
          <Text color="$text" fontSize={24} fontWeight="700" letterSpacing={-0.6} lineHeight={30}>
            {t('newRecipe.hero.title')}
          </Text>
          <Text color="$textMuted" fontSize={14} lineHeight={20}>
            {t('newRecipe.hero.subtitle')}
          </Text>
        </YStack>

        {/* Options grid 2×2.
            The blob tints are deliberately **varied hues**, not the cool ramp
            used for step badges. Here the color is doing real work — telling
            four different actions apart at a glance — and a cropped blob is a
            big enough shape to carry a distinct hue. The ramp was tried and
            reverted: four near-identical blues made the tiles look stamped. */}
        <YStack gap="$3">
          <XStack gap="$3">
            <BlobActionCard
              Icon={LinkIcon}
              label={t('newRecipe.options.link')}
              blobColor="$accentLavender"
              variant={0}
              onPress={() => router.push('/new-recipe/link')}
            />
            <BlobActionCard
              Icon={Camera}
              label={t('newRecipe.options.image')}
              blobColor="$accentPink"
              variant={1}
              onPress={() => router.push('/new-recipe/image')}
            />
          </XStack>
          <XStack gap="$3">
            <BlobActionCard
              Icon={Type}
              label={t('newRecipe.options.text')}
              blobColor="$accentPeach"
              variant={2}
              onPress={() => router.push('/new-recipe/text')}
            />
            <BlobActionCard
              Icon={PencilLine}
              label={t('newRecipe.options.manual')}
              blobColor="$accentMint"
              variant={3}
              onPress={() => router.push('/new-recipe/manual')}
            />
          </XStack>
        </YStack>

        {/* Drafts — a shimmer while loading, then the list (hidden if empty). */}
        {draftsLoading ? (
          <YStack gap="$3">
            <Text color="$text" fontSize={20} fontWeight="700" letterSpacing={-0.6}>
              {t('newRecipe.drafts.title')}
            </Text>
            <DraftsSkeleton rows={2} />
          </YStack>
        ) : drafts && drafts.length > 0 ? (
          <YStack gap="$3">
            <XStack alignItems="center" justifyContent="space-between">
              <Text color="$text" fontSize={20} fontWeight="700" letterSpacing={-0.6}>
                {t('newRecipe.drafts.title')}
              </Text>
              {drafts.length > 3 ? (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={6}
                  onPress={() => router.push('/new-recipe/drafts' as never)}
                >
                  {/* Muted grey + chevron — the exact "see all" from the feed. */}
                  <XStack alignItems="center" gap={2}>
                    <Text color="$textMuted" fontSize={12.5} fontWeight="600">
                      {t('newRecipe.drafts.seeAll')}
                    </Text>
                    <SeeAllChevron />
                  </XStack>
                </Pressable>
              ) : null}
            </XStack>

            {/* One draft per row, full width — the card is a horizontal row and
                needs the space; two-up left it cramped. */}
            <YStack gap="$2">
              {drafts.slice(0, 3).map((d) => (
                <DraftCard key={d.id} draft={d} />
              ))}
            </YStack>
          </YStack>
        ) : null}
      </YStack>
    </ScrollView>
  );
}


