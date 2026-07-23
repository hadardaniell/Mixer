import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { SettingsHeader } from '@/features/settings/components/SettingsHeader';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import type { Language } from '@/shared/lib/i18n';
import { useIsRtl } from '@/shared/lib/useIsRtl';

const OPTIONS: { value: Language; labelKey: string }[] = [
  { value: 'he', labelKey: 'settings.languageHe' },
  { value: 'en', labelKey: 'settings.languageEn' },
];

export function LanguageScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isRtl = useIsRtl();
  const { language, changeLanguage } = useLanguage();

  return (
    <YStack
      flex={1}
      backgroundColor="$bg"
      paddingHorizontal={20}
      paddingTop={insets.top + 8}
      gap="$4"
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      <SettingsHeader title={t('settings.language')} />

      <YStack
        backgroundColor="$surface"
        borderRadius={18}
        overflow="hidden"
        shadowColor="black"
        shadowOpacity={0.06}
        shadowRadius={14}
        shadowOffset={{ width: 0, height: 6 }}
        elevation={2}
      >
        {OPTIONS.map((opt, i) => {
          const selected = opt.value === language;
          return (
            <XStack
              key={opt.value}
              onPress={() => void changeLanguage(opt.value)}
              alignItems="center"
              paddingHorizontal={16}
              paddingVertical={16}
              borderTopWidth={i > 0 ? 1 : 0}
              borderColor="$border"
              pressStyle={{ backgroundColor: '$bgSubtle' }}
            >
              <Text flex={1} fontSize={15} fontWeight="600" color={selected ? '$primary' : '$text'}>
                {t(opt.labelKey)}
              </Text>
              {selected ? <Check size={20} color={theme.primary?.val as string} /> : null}
            </XStack>
          );
        })}
      </YStack>

      <Text fontSize={13} color="$textMuted" paddingHorizontal="$2">
        {t('settings.restartRequired')}
      </Text>
    </YStack>
  );
}
