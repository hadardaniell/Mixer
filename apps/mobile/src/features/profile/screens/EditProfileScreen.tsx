import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { isRTL } from '@/shared/lib/i18n';

/** Stub edit-profile screen — wires navigation now; form to follow. */
export function EditProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRtl = isRTL(language);
  const ink = theme.text?.val as string;
  const Back = isRtl ? ArrowRight : ArrowLeft;

  return (
    <YStack
      flex={1}
      backgroundColor="$bg"
      paddingHorizontal="$4"
      paddingTop={insets.top + 8}
      gap="$5"
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      <XStack alignItems="center" gap="$3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8}>
          <Back size={26} color={ink} />
        </Pressable>
        <Text fontSize={20} fontWeight="700" color="$text">
          {t('profile.edit.title')}
        </Text>
      </XStack>

      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <View
          width={72}
          height={72}
          borderRadius={36}
          backgroundColor="$accentLavender"
          alignItems="center"
          justifyContent="center"
        >
          <Pencil size={30} color={theme.primary?.val as string} />
        </View>
        <Text fontSize={15} color="$textMuted" textAlign="center">
          {t('profile.edit.comingSoon')}
        </Text>
      </YStack>
    </YStack>
  );
}
