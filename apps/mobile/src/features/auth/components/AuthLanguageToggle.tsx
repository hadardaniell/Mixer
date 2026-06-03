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
      backgroundColor="$surface"
      borderColor="$border"
      borderRadius={999}
      borderWidth={1}
      padding={3}
      gap={2}
      flexDirection={isRtl ? 'row' : 'row-reverse'}
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
          >
            <View
              alignItems="center"
              justifyContent="center"
              paddingVertical={6}
              paddingHorizontal={20}
              borderRadius={999}
              backgroundColor={selected ? '$accentLavender' : 'transparent'}
              pressStyle={{ backgroundColor: selected ? '$accentLavender' : '$bgSubtle' }}
            >
              <Text
                color={selected ? '$primary' : '$text'}
                fontSize={14}
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
