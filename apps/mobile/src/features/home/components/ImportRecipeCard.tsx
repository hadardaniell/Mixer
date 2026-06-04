import { Image as ImageIcon, Link as LinkIcon, Sparkles, Video } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

export type ImportRecipeSource = 'ai' | 'image' | 'video' | 'link';

interface ImportRecipeCardProps {
  onCreatePress: () => void;
  onSourcePress?: (source: ImportRecipeSource) => void;
}

/**
 * Home CTA — "Got a recipe link?" card.
 *
 * Self-contained so we can swap copy/illustration/chips later without touching
 * the home screen layout. The illustration is a placeholder (a chef-hat-on-a-
 * lavender-blob) until a final asset is provided.
 */
export function ImportRecipeCard({ onCreatePress, onSourcePress }: ImportRecipeCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const ink = theme.text?.val as string;
  const primary = theme.primary?.val as string;

  return (
    <YStack
      backgroundColor="$surface"
      borderRadius={24}
      padding="$4"
      gap="$3"
      shadowColor="black"
      shadowOpacity={0.08}
      shadowRadius={28}
      shadowOffset={{ width: 0, height: 14 }}
      elevation={5}
    >
      <XStack alignItems="center" gap="$3">
        {/* Illustration placeholder */}
        <View
          width={80}
          height={80}
          borderRadius={20}
          backgroundColor="$accentLavender"
          alignItems="center"
          justifyContent="center"
        >
          <Sparkles size={36} color={primary} />
        </View>

        <YStack flex={1} gap="$2" alignItems="center">
          <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
            {t('home.cta.title')}
          </Text>
          <Text color="$textMuted" fontSize={13} textAlign="center">
            {t('home.cta.subtitle')}
          </Text>
          <Pressable onPress={onCreatePress} accessibilityRole="button">
            <View
              paddingHorizontal={20}
              paddingVertical={8}
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
            </View>
          </Pressable>
        </YStack>
      </XStack>

      {/* Source chips */}
      <XStack justifyContent="space-around" gap="$2" paddingTop="$1">
        <SourceChip
          icon={<Sparkles size={16} color={primary} />}
          label={t('home.cta.sources.ai')}
          highlighted
          onPress={() => onSourcePress?.('ai')}
        />
        <SourceChip
          icon={<ImageIcon size={16} color={ink} />}
          label={t('home.cta.sources.image')}
          onPress={() => onSourcePress?.('image')}
        />
        <SourceChip
          icon={<Video size={16} color={ink} />}
          label={t('home.cta.sources.video')}
          onPress={() => onSourcePress?.('video')}
        />
        <SourceChip
          icon={<LinkIcon size={16} color={ink} />}
          label={t('home.cta.sources.link')}
          onPress={() => onSourcePress?.('link')}
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
