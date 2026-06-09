import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { isRTL } from '@/shared/lib/i18n';

interface CreateFlowHeaderProps {
  title: string;
  subtitle?: string;
  /** Override the back behavior. Defaults to going back to the previous page
   * (falling back to the create-recipe chooser on direct entry). */
  onBack?: () => void;
}

/**
 * Shared header for the create-recipe sub-flows: a back chevron on the start
 * side (RTL-aware) with a centered title + muted subtitle.
 */
export function CreateFlowHeader({ title, subtitle, onBack }: CreateFlowHeaderProps) {
  const { language } = useLanguage();
  const router = useRouter();
  const theme = useTheme();
  const ink = theme.text?.val as string;
  const isRtl = isRTL(language);
  // "Back" points the way you came from: right in RTL, left in LTR.
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/new-recipe' as never);
  };

  return (
    <YStack gap="$1">
      <XStack width="100%" justifyContent="flex-start" zIndex={1}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          hitSlop={12}
          style={{ padding: 4 }}
        >
          <BackIcon size={28} color={ink} />
        </Pressable>
      </XStack>
      {/* Decorative title block — must not intercept taps on the back chevron,
          which it overlaps via the negative top margin. */}
      <YStack alignItems="center" gap="$1" marginTop={-16} pointerEvents="none">
        <Text color="$text" fontSize={26} fontWeight="700" letterSpacing={-0.5} textAlign="center">
          {title}
        </Text>
        {subtitle ? (
          <Text color="$textMuted" fontSize={15} textAlign="center">
            {subtitle}
          </Text>
        ) : null}
      </YStack>
    </YStack>
  );
}
