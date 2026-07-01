import { Image as ImageIcon, Link as LinkIcon, Video } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, type LayoutChangeEvent, Pressable } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

export type ImportRecipeSource = 'ai' | 'image' | 'video' | 'link';

interface ImportRecipeCardProps {
  onCreatePress: () => void;
  onSourcePress?: (source: ImportRecipeSource) => void;
}

const CTA_ILLUSTRATION = require('../../../assets/images/CTA.png');

// Approx. rendered width of one chip incl. the row gap — used to decide how
// many chips fit on a single line before any would wrap.
const CHIP_WIDTH = 92;

/**
 * Home CTA — "Got a recipe link?" card.
 *
 * Self-contained so we can swap copy/chips later without touching the home
 * screen layout. The illustration is the CTA.png asset (bowl + recipe sheet +
 * whisk on soft blobs).
 */
export function ImportRecipeCard({ onCreatePress, onSourcePress }: ImportRecipeCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const ink = theme.text?.val as string;

  const sources = [
    { key: 'image' as const, icon: <ImageIcon size={16} color={ink} />, label: t('home.cta.sources.image') },
    { key: 'video' as const, icon: <Video size={16} color={ink} />, label: t('home.cta.sources.video') },
    { key: 'link' as const, icon: <LinkIcon size={16} color={ink} />, label: t('home.cta.sources.link') },
  ];

  // How many chips fit on one line at the current column width — drop the
  // overflow rather than wrapping to a second row.
  const [rowWidth, setRowWidth] = useState(0);
  const fitCount = rowWidth > 0 ? Math.max(2, Math.floor((rowWidth + 8) / CHIP_WIDTH)) : sources.length;
  const visibleSources = sources.slice(0, Math.min(sources.length, fitCount));

  const onRowLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (Math.abs(w - rowWidth) > 1) setRowWidth(w);
  };

  return (
    <YStack
      backgroundColor="$surface"
      borderRadius={24}
      padding="$4"
      gap="$4"
      shadowColor="black"
      shadowOpacity={0.08}
      shadowRadius={28}
      shadowOffset={{ width: 0, height: 14 }}
      elevation={5}
    >
      <XStack alignItems="center" gap="$3">
        <YStack flex={1} gap="$3" alignItems="center" justifyContent="center">
          <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
            {t('home.cta.title')}
          </Text>
          <Text color="$textMuted" fontSize={13} textAlign="center">
            {t('home.cta.subtitle')}
          </Text>
          <Pressable onPress={onCreatePress} accessibilityRole="button">
            <YStack
              paddingHorizontal={22}
              paddingVertical={9}
              borderRadius={999}
              borderWidth={1.5}
              borderColor="$primary"
              backgroundColor="$surface"
              alignItems="center"
              justifyContent="center"
              pressStyle={{ backgroundColor: '$accentLavender' }}
            >
              <Text color="$primary" fontSize={14} fontWeight="700">
                {t('home.cta.button')}
              </Text>
            </YStack>
          </Pressable>

          {/* Source chips — only as many as fit on one line (no wrapping). */}
          {/* <YStack width="100%" onLayout={onRowLayout}>
            <XStack flexWrap="nowrap" justifyContent="center" gap="$2">
              {visibleSources.map((s) => (
                <SourceChip
                  key={s.key}
                  icon={s.icon}
                  label={s.label}
                  onPress={() => onSourcePress?.(s.key)}
                />
              ))}
            </XStack>
          </YStack> */}
        </YStack>

        <Image
          source={CTA_ILLUSTRATION}
          style={{ width: 170, height: 120 }}
          resizeMode="contain"
        />
      </XStack>
    </YStack>
  );
}

function SourceChip({
  icon,
  label,
  highlighted,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  highlighted?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <XStack
        alignItems="center"
        gap="$2"
        paddingHorizontal={12}
        paddingVertical={6}
        borderRadius={999}
        borderWidth={1}
        borderColor={highlighted ? '$primary' : '$border'}
        backgroundColor={highlighted ? '$accentLavender' : '$surface'}
        pressStyle={{ backgroundColor: '$bgSubtle' }}
      >
        {icon}
        <Text color={highlighted ? '$primary' : '$text'} fontSize={12} fontWeight="600">
          {label}
        </Text>
      </XStack>
    </Pressable>
  );
}
