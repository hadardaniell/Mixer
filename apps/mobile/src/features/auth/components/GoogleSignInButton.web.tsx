import { GoogleLogin } from '@react-oauth/google';
import { router } from 'expo-router';
<<<<<<< HEAD
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Text, YStack } from 'tamagui';

import { AUTH_FONT_FAMILY } from '@/features/auth/authFonts';
=======
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, YStack } from 'tamagui';

>>>>>>> 1acc038dba37cfd30d15e42a72fbe1f7ab5abfb1
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { env } from '@/shared/config/env';
import { HttpError } from '@/shared/lib/httpClient';

interface GoogleSignInButtonProps {
  onError: (message: string) => void;
<<<<<<< HEAD
  variant?: 'pill' | 'card';
}

export function GoogleSignInButton({ onError, variant = 'pill' }: GoogleSignInButtonProps) {
=======
  /** Retained for API compatibility; the design-system styling is the same now. */
  variant?: 'pill' | 'card';
}

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
>>>>>>> 1acc038dba37cfd30d15e42a72fbe1f7ab5abfb1
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!env.googleWebClientId) {
    return (
<<<<<<< HEAD
      <Text textAlign="center" color="$gray10" fontFamily={AUTH_FONT_FAMILY} fontSize="$2">
=======
      <Text textAlign="center" color="$textMuted" fontSize="$2">
>>>>>>> 1acc038dba37cfd30d15e42a72fbe1f7ab5abfb1
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
<<<<<<< HEAD
      router.replace('/home' as never);
=======
      // Brand-new Google users have no phoneNumber yet — collect it before
      // letting them into the app.
      const next = res.user.phoneNumber ? '/home' : '/complete-profile';
      router.replace(next as never);
>>>>>>> 1acc038dba37cfd30d15e42a72fbe1f7ab5abfb1
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

<<<<<<< HEAD
  return (
    <YStack alignItems="center">
=======
  // Google's GSI library renders its own button (their branding is required for
  // the idToken flow). We size/shape it to sit alongside the design-system
  // buttons — rectangular, large, outline.
  return (
    <YStack width="100%" alignItems="center" paddingBottom={8}>
>>>>>>> 1acc038dba37cfd30d15e42a72fbe1f7ab5abfb1
      <GoogleLogin
        onSuccess={(res) => {
          if (res.credential) void handleCredential(res.credential);
          else onError(t('auth.networkError'));
        }}
        onError={() => onError(t('auth.networkError'))}
        text="continue_with"
        shape="pill"
<<<<<<< HEAD
=======
        theme="outline"
        size="large"
>>>>>>> 1acc038dba37cfd30d15e42a72fbe1f7ab5abfb1
        width="320"
        useOneTap={false}
      />
    </YStack>
  );
}
