import { useTranslation } from 'react-i18next';
import { Text, YStack } from 'tamagui';

import { GhostRecipeCard } from '@/features/home/components/GhostRecipeCard';
import { PrimaryButton } from '@/shared/ui/PrimaryButton';

interface HomeEmptyStateProps {
  onCreatePress: () => void;
}

/**
 * Shown when every feed section is empty — a brand-new account, where each section
 * hides itself and the screen would otherwise be the CTA card floating in white.
 *
 * The illustration is the outline of the card that isn't there yet — not the mixer
 * bowl. The CTA directly above already carries a stirring bowl, so a second, larger
 * one repeated the mark and set two loops running against each other on one screen.
 * The ghost card is still, and says something the bowl couldn't: this is where your
 * first recipe lands.
 */
export function HomeEmptyState({ onCreatePress }: HomeEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <YStack alignItems="center" paddingHorizontal="$4" paddingTop={12} gap={18}>
      <GhostRecipeCard size={132} />

      <YStack alignItems="center" gap="$2">
        <Text fontSize={20} fontWeight="700" letterSpacing={-0.6} color="$text" textAlign="center">
          {t('home.empty.title')}
        </Text>
        <Text fontSize={13} color="$textMuted" textAlign="center">
          {t('home.empty.subtitle')}
        </Text>
      </YStack>

      <YStack width="100%" maxWidth={320}>
        <PrimaryButton label={t('home.empty.button')} onPress={onCreatePress} />
      </YStack>
    </YStack>
  );
}
