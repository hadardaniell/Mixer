import { GoogleLogin } from '@react-oauth/google';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { env } from '@/shared/config/env';
import { HttpError } from '@/shared/lib/httpClient';

interface GoogleSignInButtonProps {
  onError: (message: string) => void;
  /** Retained for API compatibility; the design-system styling is the same now. */
  variant?: 'pill' | 'card';
}

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!env.googleWebClientId) {
    return (
      <Text textAlign="center" color="$textMuted" fontSize="$2">
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
      // Brand-new Google users have no phoneNumber yet — collect it before
      // letting them into the app.
      const next = res.user.phoneNumber ? '/home' : '/complete-profile';
      router.replace(next as never);
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

  // Google's GSI library renders its own button (their branding is required for
  // the idToken flow). We size/shape it to sit alongside the design-system
  // buttons — rectangular, large, outline.
  return (
    <YStack width="100%" alignItems="center" paddingBottom={8}>
      <GoogleLogin
        onSuccess={(res) => {
          if (res.credential) void handleCredential(res.credential);
          else onError(t('auth.networkError'));
        }}
        onError={() => onError(t('auth.networkError'))}
        text="continue_with"
        shape="pill"
        theme="outline"
        size="large"
        width="320"
        useOneTap={false}
      />
    </YStack>
  );
}
