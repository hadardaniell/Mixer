import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';

import { AUTH_FONT_FAMILY } from '@/features/auth/authFonts';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import {
  GoogleSignInCancelledError,
  signInWithGoogle,
} from '@/features/auth/services/googleSignIn';
import { HttpError } from '@/shared/lib/httpClient';

interface GoogleSignInButtonProps {
  onError: (message: string) => void;
  variant?: 'pill' | 'card';
}

export function GoogleSignInButton({ onError, variant = 'pill' }: GoogleSignInButtonProps) {
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
        borderColor: variant === 'card' ? '#6F8286' : '#ddd',
        borderWidth: variant === 'card' ? 1.5 : 1,
        paddingVertical: variant === 'card' ? 14 : 12,
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
        <Text
          color="#111"
          flexGrow={1}
          fontFamily={AUTH_FONT_FAMILY}
          fontSize={14}
          fontWeight="500"
          numberOfLines={1}
        >
          {t('auth.continueWithGoogle')}
        </Text>
      </XStack>
    </Pressable>
  );
}
