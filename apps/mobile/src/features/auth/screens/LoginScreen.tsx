import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { H1, Text, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';

export function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();

  const handleSignIn = () => {
    signIn('dev-token', { id: 'dev', name: 'הדר', email: 'dev@mixer.app' });
    router.replace('/home' as never);
  };

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$4">
      <H1>Mixer</H1>
      <Pressable
        onPress={handleSignIn}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#333' : '#111',
          paddingVertical: 14,
          paddingHorizontal: 32,
          borderRadius: 999,
        })}
      >
        <Text color="white" fontSize="$5" fontWeight="600">
          {t('auth.login')}
        </Text>
      </Pressable>
    </YStack>
  );
}
