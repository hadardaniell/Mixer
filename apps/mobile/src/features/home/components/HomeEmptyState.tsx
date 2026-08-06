import { useTranslation } from 'react-i18next';
import { Text, YStack } from 'tamagui';

import { MixerBowl } from '@/shared/ui/MixerBowl';
import { PrimaryButton } from '@/shared/ui/PrimaryButton';

interface HomeEmptyStateProps {
  onCreatePress: () => void;
}

/**
 * Shown when every feed section is empty — a brand-new account, where each section
 * hides itself and the screen would otherwise be the CTA card floating in white.
 *
 * The bowl carries this, not color: the design language keeps surfaces monochrome and
 * lets the mark and motion do the work.
 */
export function HomeEmptyState({ onCreatePress }: HomeEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <YStack alignItems="center" paddingHorizontal="$4" paddingTop={12} gap={18}>
      <MixerBowl size={132} animated />

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
