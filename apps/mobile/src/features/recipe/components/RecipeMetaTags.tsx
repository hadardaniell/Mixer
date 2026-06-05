import type { Recipe } from '@mixer/contracts';
import { ChefHat, Clock, Utensils, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

interface RecipeMetaTagsProps {
  recipe: Recipe;
}

interface MetaChip {
  key: string;
  label: string;
  bg: string;
  Icon: LucideIcon;
}

/**
 * Under the title: a centered row of soft accent chips (servings, difficulty,
 * total time), and — when present — a second row of the recipe's tags as
 * outlined pills. Each chip renders only when its data exists.
 */
export function RecipeMetaTags({ recipe }: RecipeMetaTagsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;

  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0) || undefined;

  const chips: MetaChip[] = [];
  if (recipe.servings)
    chips.push({
      key: 'servings',
      label: t('recipe.servingsTag', { count: recipe.servings }),
      bg: '$accentPeach',
      Icon: Utensils,
    });
  if (recipe.difficulty)
    chips.push({
      key: 'difficulty',
      label: t(`recipe.difficulty.${recipe.difficulty}`),
      bg: '$accentPink',
      Icon: ChefHat,
    });
  if (totalTime)
    chips.push({
      key: 'time',
      label: t('recipe.minutesShort', { count: totalTime }),
      bg: '$accentLavender',
      Icon: Clock,
    });

  if (chips.length === 0 && recipe.tags.length === 0) return null;

  return (
    <YStack gap="$2" alignItems="center" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
      {chips.length > 0 ? (
        <XStack flexWrap="wrap" justifyContent="center" gap="$2">
          {chips.map(({ key, label, bg, Icon }) => (
            <XStack
              key={key}
              alignItems="center"
              gap={6}
              paddingHorizontal={12}
              paddingVertical={8}
              borderRadius={14}
              backgroundColor={bg}
            >
              <Icon size={16} color={ink} />
              <Text fontSize={13} fontWeight="600" color="$text">
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
