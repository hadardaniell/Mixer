import { ArrowRight, Globe } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useTheme, View, XStack } from 'tamagui';

import { AuthLanguageToggle } from '@/features/auth/components/AuthLanguageToggle';
import { useLanguage } from '@/features/settings/hooks/useLanguage';

interface AuthHeaderProps {
  /** When provided, renders a back button on the right edge. */
  onBack?: () => void;
}

/**
 * Shared auth-screens header.
 *
 * Layout is forced LTR so the language controls stay pinned on the left and
 * the back button on the right regardless of the app's UI direction.
 */
export function AuthHeader({ onBack }: AuthHeaderProps) {
  const theme = useTheme();
  const { language, changeLanguage } = useLanguage();
  const ink = theme.text?.val as string;

  const toggleLanguage = () => changeLanguage(language === 'he' ? 'en' : 'he');

  return (
    <XStack
      width="100%"
      alignItems="center"
      justifyContent="space-between"
      style={{ direction: 'ltr' } as never}
    >
      <XStack alignItems="center" gap="$2">
        <CircleButton onPress={toggleLanguage}>
          <Globe size={22} color={ink} />
        </CircleButton>
        <AuthLanguageToggle language={language} onChangeLanguage={changeLanguage} />
      </XStack>

      {onBack ? (
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8}>
          <ArrowRight size={26} color={ink} />
        </Pressable>
      ) : null}
    </XStack>
  );
}

function CircleButton({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={6}>
      <View
        width={44}
        height={44}
        borderRadius={22}
        borderWidth={1}
        borderColor="$border"
        backgroundColor="$surface"
        alignItems="center"
        justifyContent="center"
        pressStyle={{ backgroundColor: '$bgSubtle' }}
      >
        {children}
      </View>
    </Pressable>
  );
}
