import { Pressable } from 'react-native';
import { Text, View, XStack } from 'tamagui';
import { useTranslation } from 'react-i18next';

import { isRTL, type Language } from '@/shared/lib/i18n';

interface AuthLanguageToggleProps {
  language: Language;
  onChangeLanguage: (language: Language) => void | Promise<void>;
}

export function AuthLanguageToggle({ language, onChangeLanguage }: AuthLanguageToggleProps) {
  const { t } = useTranslation();
  const isRtl = isRTL(language);
  const options: { code: Language; label: string }[] = [
    { code: 'he', label: t('settings.languageHe') },
    { code: 'en', label: t('settings.languageEn') },
  ];

  return (
    <XStack
      alignSelf="center"
      borderColor="$border"
      borderRadius={999}
      borderWidth={1}
      flexDirection={isRtl ? 'row' : 'row-reverse'}
      overflow="hidden"
      width={220}
    >
      {options.map((option) => {
        const selected = language === option.code;
        return (
          <Pressable
            key={option.code}
            accessibilityRole="button"
            onPress={() => {
              void onChangeLanguage(option.code);
            }}
            style={{ flex: 1 }}
          >
            <View
              alignItems="center"
              justifyContent="center"
              paddingVertical={9}
              paddingHorizontal={14}
              backgroundColor={selected ? '$accentLimeBright' : '$surface'}
              pressStyle={{
                backgroundColor: selected ? '$buttonSecondaryBgHover' : '$bgSubtle',
              }}
            >
              <Text
                color={selected ? '$textOnSecondary' : '$textMuted'}
                fontSize={15}
                fontWeight={selected ? '700' : '600'}
                textAlign="center"
              >
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </XStack>
  );
}
