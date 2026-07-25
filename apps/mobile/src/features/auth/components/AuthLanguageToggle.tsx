import { Pressable } from 'react-native';
import { Text, View, XStack } from 'tamagui';
import { useTranslation } from 'react-i18next';

import { type Language } from '@/shared/lib/i18n';

interface AuthLanguageToggleProps {
  language: Language;
  onChangeLanguage: (language: Language) => void | Promise<void>;
}

export function AuthLanguageToggle({ language, onChangeLanguage }: AuthLanguageToggleProps) {
  const { t } = useTranslation();
  const options: { code: Language; label: string }[] = [
    { code: 'he', label: t('settings.languageHe') },
    { code: 'en', label: t('settings.languageEn') },
  ];

  return (
    // Fixed chip order (he then en). It previously flipped with the selected
    // language, which made the two pills swap sides on every toggle — the pill
    // you just tapped jumped across the control. The order is a property of the
    // control, not of which option is active, so it stays put now.
    <XStack
      alignSelf="center"
      backgroundColor="$surface"
      borderColor="$border"
      borderRadius={999}
      borderWidth={1}
      padding={3}
      gap={2}
      flexDirection="row"
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
