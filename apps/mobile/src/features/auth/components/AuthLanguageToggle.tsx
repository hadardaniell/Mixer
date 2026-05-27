import { Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';
import { useTranslation } from 'react-i18next';

import { AUTH_FONT_FAMILY } from '@/features/auth/authFonts';
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
      borderColor="#6F8286"
      borderRadius={999}
      borderWidth={1.5}
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
            style={({ pressed }) => ({
              backgroundColor: selected ? '#2B1B10' : pressed ? '#ffd7e7' : '#FFFFFF',
              flex: 1,
              paddingHorizontal: 14,
              paddingVertical: 8,
            })}
          >
            <Text
              color={selected ? 'rgb(246, 235, 97)' : '#16181F'}
              fontFamily={AUTH_FONT_FAMILY}
              fontSize={15}
              fontWeight={selected ? '800' : '600'}
              textAlign="center"
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </XStack>
  );
}
