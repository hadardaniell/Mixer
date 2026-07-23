import type { Recipe } from '@mixer/contracts';
import { ChefHat, Clock, Utensils, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { formatDuration } from '@/shared/lib/formatDuration';
import { useIsRtl } from '@/shared/lib/useIsRtl';

interface RecipeMetaTagsProps {
  recipe: Recipe;
}

interface MetaChip {
  key: string;
  label: string;
  /** Theme alias (no `$`) for the soft fill. */
  bg: string;
  /** Theme alias (no `$`) for the icon + label. */
  ink: string;
  Icon: LucideIcon;
}

/**
 * Under the title: a centered row of outlined meta chips (servings, difficulty,
 * total time), and — when present — a second row of the recipe's tags.
 *
 * The chips are **softly filled with no outline**, each fact owning a fixed tint
 * from the cool ramp: periwinkle for servings, pink for difficulty, teal for
 * time.
 *
 * All three tints are cool and sit at the same lightness, so the row reads as
 * one family rather than three unrelated buttons — which is what the earlier
 * blue/amber/teal outline did wrong. The chips land directly under a saturated
 * food photograph, and anything that competes with it there loses.
 *
 * Every label uses the ink paired to its own tint (4.6:1 or better) rather than
 * falling back to near-black, which goes muddy on a saturated fill.
 */
export function RecipeMetaTags({ recipe }: RecipeMetaTagsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const hex = (alias: string) =>
    (theme as Record<string, { val: string } | undefined>)[alias]?.val as string;

  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0) || undefined;

  const chips: MetaChip[] = [];
  if (recipe.servings)
    chips.push({
      key: 'servings',
      label: t('recipe.servingsTag', { count: recipe.servings }),
      bg: 'tintPeriwinkle',
      ink: 'textOnPrimary',
      Icon: Utensils,
    });
  if (recipe.difficulty)
    chips.push({
      key: 'difficulty',
      label: t(`recipe.difficulty.${recipe.difficulty}`),
      bg: 'tintPink',
      ink: 'tintPinkInk',
      Icon: ChefHat,
    });
  if (totalTime)
    chips.push({
      key: 'time',
      label: formatDuration(totalTime, t),
      bg: 'tintTeal',
      ink: 'tintTealInk',
      Icon: Clock,
    });

  if (chips.length === 0 && recipe.tags.length === 0) return null;

  return (
    <YStack gap="$2" alignItems="center" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
      {chips.length > 0 ? (
        <XStack flexWrap="wrap" justifyContent="center" gap="$2">
          {chips.map(({ key, label, bg, ink, Icon }) => (
            <XStack
              key={key}
              alignItems="center"
              gap={6}
              paddingHorizontal={12}
              paddingVertical={7}
              borderRadius={999}
              backgroundColor={hex(bg)}
            >
              <Icon size={15} color={hex(ink)} strokeWidth={2} />
              <Text fontSize={13} fontWeight="700" color={hex(ink)}>
                {label}
              </Text>
            </XStack>
          ))}
        </XStack>
      ) : null}

      {recipe.tags.length > 0 ? (
        <XStack flexWrap="wrap" justifyContent="center" gap="$2">
          {recipe.tags.map((tag) => (
            <XStack
              key={tag}
              paddingHorizontal={12}
              paddingVertical={6}
              borderRadius={999}
              borderWidth={1}
              borderColor="$border"
              backgroundColor="$surface"
            >
              <Text fontSize={12} fontWeight="600" color="$textMuted">
                {tag}
              </Text>
            </XStack>
          ))}
        </XStack>
      ) : null}
    </YStack>
  );
}
