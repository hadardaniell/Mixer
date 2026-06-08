import type { Recipe } from '@mixer/contracts';
import { useRouter } from 'expo-router';
import { Bell, FileText, MoreVertical } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Image, type ImageSourcePropType, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useDrafts } from '@/features/recipe/hooks/useDrafts';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { isRTL } from '@/shared/lib/i18n';

const CTA_ILLUSTRATION = require('../../../assets/images/CTA.png');

const OPTION_IMAGES = {
  link: require('../../../assets/images/create-recipe/by link.png'),
  image: require('../../../assets/images/create-recipe/by photo.png'),
  text: require('../../../assets/images/create-recipe/by text.png'),
  manual: require('../../../assets/images/create-recipe/by hands.png'),
} satisfies Record<string, ImageSourcePropType>;

const DRAFT_ACCENTS = ['$accentMint', '$accentPink', '$accentPeach', '$accentLavender'] as const;

function pickAccent(id: string): (typeof DRAFT_ACCENTS)[number] {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return DRAFT_ACCENTS[sum % DRAFT_ACCENTS.length]!;
}

function daysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export function NewRecipeScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isRtl = isRTL(language);
  const ink = theme.text?.val as string;
  const { data: drafts } = useDrafts(6);

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

        {/* Hero card */}
        <XStack
          backgroundColor="$surface"
          borderRadius={24}
          paddingVertical="$5"
          paddingHorizontal="$5"
          gap="$3"
          alignItems="center"
          shadowColor="black"
          shadowOpacity={0.08}
          shadowRadius={28}
          shadowOffset={{ width: 0, height: 14 }}
          elevation={5}
        >
          <YStack flex={1} gap="$2">
            <Text color="$text" fontSize={20} fontWeight="700" lineHeight={26}>
              {t('newRecipe.hero.title')}
            </Text>
            <Text color="$textMuted" fontSize={14} lineHeight={20}>
              {t('newRecipe.hero.subtitle')}
            </Text>
          </YStack>
          <Image
            source={CTA_ILLUSTRATION}
            style={{ width: 150, height: 140 }}
            resizeMode="contain"
          />
        </XStack>

        {/* Options grid 2×2 */}
        <YStack gap="$3">
          <XStack gap="$3">
            <OptionCard
              image={OPTION_IMAGES.link}
              label={t('newRecipe.options.link')}
              onPress={() => router.push('/new-recipe/link')}
            />
            <OptionCard
              image={OPTION_IMAGES.image}
              label={t('newRecipe.options.image')}
              onPress={() => router.push('/new-recipe/image')}
            />
          </XStack>
          <XStack gap="$3">
            <OptionCard
              image={OPTION_IMAGES.text}
              label={t('newRecipe.options.text')}
              onPress={() => router.push('/new-recipe/text')}
            />
            <OptionCard
              image={OPTION_IMAGES.manual}
              label={t('newRecipe.options.manual')}
              onPress={() => {}}
            />
          </XStack>
        </YStack>

        {/* Drafts — only shown when the user actually has some */}
        {drafts && drafts.length > 0 ? (
          <YStack gap="$3">
            <XStack alignItems="center" justifyContent="space-between">
              <Text color="$text" fontSize={17} fontWeight="700">
                {t('newRecipe.drafts.title')}
              </Text>
              <Pressable accessibilityRole="button" hitSlop={6}>
                <Text color="$primary" fontSize={14} fontWeight="600">
                  {t('newRecipe.drafts.seeAll')}
                </Text>
              </Pressable>
            </XStack>

            <XStack gap="$3">
              {drafts.slice(0, 2).map((d) => (
                <DraftCard key={d.id} draft={d} ink={ink} />
              ))}
            </XStack>
          </YStack>
        ) : null}
      </YStack>
    </ScrollView>
  );
}

function OptionCard({
  image,
  label,
  onPress,
}: {
  image: ImageSourcePropType;
  label: string;
  onPress: () => void;
}) {
  return (
    <YStack
      flex={1}
      backgroundColor="$surface"
      borderRadius={24}
      paddingVertical="$4"
      gap="$2"
      alignItems="center"
      shadowColor="black"
      shadowOpacity={0.06}
      shadowRadius={14}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={2}
      pressStyle={{ opacity: 0.92, scale: 0.98 }}
      onPress={onPress}
    >
      <Image source={image} style={{ width: 104, height: 104 }} resizeMode="contain" />
      <Text color="$text" fontSize={15} fontWeight="700">
        {label}
      </Text>
    </YStack>
  );
}

function DraftCard({ draft, ink }: { draft: Recipe; ink: string }) {
  const { t } = useTranslation();
  return (
    <XStack
      flex={1}
      maxWidth="48%"
      backgroundColor="$surface"
      borderRadius={18}
      padding="$3"
      gap="$2"
      alignItems="center"
      shadowColor="black"
      shadowOpacity={0.06}
      shadowRadius={14}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={2}
      pressStyle={{ opacity: 0.92, scale: 0.98 }}
    >
      <YStack
        width={40}
        height={40}
        borderRadius={12}
        backgroundColor={pickAccent(draft.id)}
        alignItems="center"
        justifyContent="center"
      >
        <FileText size={20} color={ink} strokeWidth={1.8} />
      </YStack>

      <YStack flex={1} gap={2}>
        <Text color="$text" fontSize={13} fontWeight="700" numberOfLines={1}>
          {draft.title}
        </Text>
        <Text color="$textMuted" fontSize={11} numberOfLines={1}>
          {t('newRecipe.drafts.updatedDaysAgo', { count: daysAgo(draft.updatedAt) })}
        </Text>
      </YStack>

      <Pressable accessibilityRole="button" hitSlop={6}>
        <MoreVertical size={18} color={ink} />
      </Pressable>
    </XStack>
  );
}
