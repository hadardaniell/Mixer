import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import {
  GoogleSignInCancelledError,
  signInWithGoogle,
} from '@/features/auth/services/googleSignIn';
import { HttpError } from '@/shared/lib/httpClient';

interface GoogleSignInButtonProps {
  onError: (message: string) => void;
}

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    onError('');
    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const res = await authApi.loginWithGoogle({ idToken });
      signIn(res);
      router.replace('/home' as never);
    } catch (e) {
      if (e instanceof GoogleSignInCancelledError) {
        // user dismissed — silent
      } else if (
        e instanceof HttpError &&
        e.status === 409 &&
        (e.body as { error?: string } | undefined)?.error === 'link_requires_password'
      ) {
        onError(t('auth.linkRequiresPassword'));
      } else {
        onError(t('auth.networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#f5f5f5' : 'white',
        borderColor: '#ddd',
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 999,
        alignItems: 'center',
        opacity: loading ? 0.6 : 1,
      })}
    >
      <XStack alignItems="center" gap="$2">
        <Text fontSize="$5" fontWeight="700" color="#4285F4">
          G
        </Text>
        <Text fontSize="$4" fontWeight="600" color="#111">
          {t('auth.continueWithGoogle')}
        </Text>
      </XStack>
    </Pressable>
  );
}
