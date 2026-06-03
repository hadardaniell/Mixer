import { Lightbulb, Soup } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

interface RecipeTipProps {
  text: string;
}

/**
 * The "טיפ קטן" card. Sourced from ingredient notes — the screen renders one
 * per note and skips rendering entirely when there are none.
 */
export function RecipeTip({ text }: RecipeTipProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;
  const rowDirection = isRtl ? 'row-reverse' : 'row';

  return (
    <XStack
      backgroundColor="$surface"
      borderRadius={10}
      paddingHorizontal="$3"
      paddingVertical="$2"
      gap="$3"
      alignItems="center"
      flexDirection={rowDirection}
      shadowColor="black"
      shadowOpacity={0.06}
      shadowRadius={12}
      shadowOffset={{ width: 0, height: 4 }}
      elevation={3}
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      <View
        width={36}
        height={36}
        borderRadius={999}
        backgroundColor="$accentLimeBright"
        alignItems="center"
        justifyContent="center"
      >
        <Lightbulb size={20} color={ink} />
      </View>

      <YStack flex={1} gap="$1">
        <Text fontSize={13} fontWeight="700" color="$text" textAlign={isRtl ? 'right' : 'left'}>
          {t('recipe.tipTitle')}
        </Text>
        <Text
          fontSize={13}
          color="$textMuted"
          lineHeight={18}
          textAlign={isRtl ? 'right' : 'left'}
          numberOfLines={2}
        >
          {text}
        </Text>
      </YStack>

      <View
        width={48}
        height={36}
        borderRadius={999}
        backgroundColor="$accentLavender"
        alignItems="center"
        justifyContent="center"
      >
        <Soup size={26} color={ink} strokeWidth={1.5} />
      </View>
    </XStack>
  );
}
