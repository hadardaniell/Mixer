import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';

/** "Already have an account? Login" — routes to /login. */
export function HaveAccountLink() {
  const { t } = useTranslation();
  return (
    <Link href={'/login' as never} asChild>
      <Pressable hitSlop={8}>
        <XStack alignItems="center" justifyContent="center" gap={5}>
          <Text color="$textMuted" fontSize={15}>
            {t('auth.haveAccount')}
          </Text>
          <Text color="$primary" fontSize={15} fontWeight="700">
            {t('auth.login')}
          </Text>
        </XStack>
      </Pressable>
    </Link>
  );
}
