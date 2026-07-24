import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, View, XStack, YStack } from 'tamagui';

import { ConfettiBurst } from '@/features/home/components/ConfettiBurst';
import { BlobShape } from '@/shared/ui/BlobShape';
import { MixerBowl } from '@/shared/ui/MixerBowl';

export type ImportRecipeSource = 'ai' | 'image' | 'video' | 'link';

interface ImportRecipeCardProps {
  onCreatePress: () => void;
  onSourcePress?: (source: ImportRecipeSource) => void;
}

const STAGE = 80;
const DISC = 44;

/**
 * Home CTA — the stirring bowl on a drifting blob, throwing confetti.
 *
 * Three ideas from the project's mood board, combined: the organic blob, the
 * solid ink disc, and the colored confetti. The card itself stays white and
 * square on the grid — all of the life is in the mark, none of it in the
 * container. That's what lets the confetti be fully saturated without the
 * screen feeling loud.
 */
export function ImportRecipeCard({ onCreatePress }: ImportRecipeCardProps) {
  const { t } = useTranslation();

  return (
    <XStack
      backgroundColor="$surface"
      borderRadius={20}
      padding="$4"
      gap="$3"
      alignItems="center"
      // Same tight, dark lift as the feed cards — a faint wide blur disappears
      // against a pure-white canvas.
      shadowColor="black"
      shadowOpacity={0.28}
      shadowRadius={14}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={10}
    >
      <View width={STAGE} height={STAGE} alignItems="center" justifyContent="center">
        <View position="absolute">
          <BlobShape size={STAGE} color="$accentLavender" variant={0} />
        </View>
        {/* The bowl sits well inside the blob, otherwise its rim spills past the
            silhouette and the two shapes stop reading as one. */}
        <MixerBowl size={STAGE - 16} animated />
        <ConfettiBurst size={STAGE} />
      </View>

      <YStack flex={1} gap="$1">
        <Text color="$text" fontSize={17} fontWeight="700" letterSpacing={-0.4}>
          {t('home.cta.title')}
        </Text>
        <Text color="$textMuted" fontSize={12.5} lineHeight={18}>
          {t('home.cta.subtitle')}
        </Text>
      </YStack>

      <Pressable onPress={onCreatePress} accessibilityRole="button" hitSlop={6}>
        <YStack
          width={DISC}
          height={DISC}
          borderRadius={999}
          backgroundColor="$text"
          alignItems="center"
          justifyContent="center"
          shadowColor="black"
          shadowOpacity={0.28}
          shadowRadius={10}
          shadowOffset={{ width: 0, height: 5 }}
          elevation={6}
          pressStyle={{ scale: 0.9 }}
        >
          <Plus size={22} color="#FFFFFF" strokeWidth={2.2} />
        </YStack>
      </Pressable>
    </XStack>
  );
}
