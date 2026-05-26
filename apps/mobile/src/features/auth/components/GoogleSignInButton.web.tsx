import { GoogleLogin } from '@react-oauth/google';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Text, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { env } from '@/shared/config/env';
import { HttpError } from '@/shared/lib/httpClient';

interface GoogleSignInButtonProps {
  onError: (message: string) => void;
  variant?: 'pill' | 'card';
}

export function GoogleSignInButton({ onError, variant = 'pill' }: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!env.googleWebClientId) {
    return (
      <Text textAlign="center" color="$gray10" fontSize="$2">
        Google sign-in not configured
      </Text>
    );
  }

  const handleCredential = async (idToken: string) => {
    if (busy) return;
    onError('');
    setBusy(true);
    try {
      const res = await authApi.loginWithGoogle({ idToken });
      signIn(res);
      router.replace('/home' as never);
    } catch (e) {
      if (
        e instanceof HttpError &&
        e.status === 409 &&
        (e.body as { error?: string } | undefined)?.error === 'link_requires_password'
      ) {
        onError(t('auth.linkRequiresPassword'));
      } else {
        onError(t('auth.networkError'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <YStack alignItems="center">
      <GoogleLogin
        onSuccess={(res) => {
          if (res.credential) void handleCredential(res.credential);
          else onError(t('auth.networkError'));
        }}
        onError={() => onError(t('auth.networkError'))}
        text="continue_with"
        shape="pill"
        width="320"
        useOneTap={false}
      />
    </YStack>
  );
}
