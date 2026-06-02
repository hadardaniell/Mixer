import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';

/** "Don't have an account? Sign up" — routes to /register. */
export function NoAccountLink() {
  const { t } = useTranslation();
  return (
    <Link href={'/register' as never} asChild>
      <Pressable hitSlop={8}>
        <XStack alignItems="center" justifyContent="center" gap={5}>
          <Text color="$textMuted" fontSize={15}>
            {t('auth.dontHaveAccount')}
          </Text>
          <Text color="$primary" fontSize={15} fontWeight="700">
            {t('auth.signUp')}
          </Text>
        </XStack>
      </Pressable>
    </Link>
  );
}
