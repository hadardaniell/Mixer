import { useGoogleLogin } from '@react-oauth/google';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { env } from '@/shared/config/env';
import { HttpError } from '@/shared/lib/httpClient';

interface GoogleSignInButtonProps {
  onError: (message: string) => void;
  /** Retained for API compatibility; the design-system styling is the same now. */
  variant?: 'pill' | 'card';
}

/**
 * Google returns here with `?code=…`. It must match an Authorized redirect URI on the
 * OAuth client exactly, so it's derived from the current origin rather than hardcoded —
 * that keeps localhost dev and the deployed site on the same code path.
 */
function redirectUri(): string {
  return `${window.location.origin}/login`;
}

/**
 * A returned code is single-use, and React can mount this component twice (two auth
 * screens, or StrictMode). Module scope, not a ref: the guard has to outlive remounts.
 */
let exchangeStarted = false;

/**
 * Outer component: renders nothing when the Web Client ID is missing.
 * This avoids calling useGoogleLogin (which requires GoogleOAuthProvider)
 * when the provider is absent.
 */
export function GoogleSignInButton(props: GoogleSignInButtonProps) {
  const { t } = useTranslation();

  if (!env.googleWebClientId) {
    return (
      <Text textAlign="center" color="$textMuted" fontSize="$2">
        Google sign-in not configured
      </Text>
    );
  }

  return <GoogleSignInButtonInner {...props} />;
}

/**
 * Inner component: guaranteed to be rendered inside GoogleOAuthProvider,
 * so the useGoogleLogin hook is safe to call.
 */
function GoogleSignInButtonInner({ onError }: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);

  // Completes the half of the flow that happens after Google redirects back.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code || exchangeStarted) return;
    exchangeStarted = true;

    // Drop the code from the address bar before doing anything else, so a refresh or a
    // shared link can't replay it.
    window.history.replaceState({}, '', window.location.pathname);

    setBusy(true);
    void (async () => {
      try {
        const res = await authApi.loginWithGoogleCode({ code, redirectUri: redirectUri() });
        signIn(res);
        // Brand-new Google users have no phoneNumber yet — collect it before
        // letting them into the app.
        router.replace((res.user.phoneNumber ? '/home' : '/complete-profile') as never);
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
    })();
    // Runs once on mount: the redirect is a full page load, so there is nothing to re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `ux_mode: 'redirect'` navigates this tab instead of opening a popup. The popup flow
  // needs the opened window to postMessage back to its opener, which iOS Safari blocks —
  // the Google tab stays blank and sign-in never completes.
  const startLogin = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'redirect',
    redirect_uri: typeof window === 'undefined' ? undefined : redirectUri(),
    onError: () => onError(t('auth.networkError')),
  });

  // Mirrors the native button so both platforms look identical. The GSI-rendered button
  // is not used here: its branding requirement applies to the id-token flow it drives.
  return (
    <Pressable
      onPress={() => startLogin()}
      disabled={busy}
      accessibilityLabel={t('auth.continueWithGoogle')}
      style={{ paddingBottom: 8 }}
    >
      <XStack
        width="100%"
        height={54}
        paddingHorizontal={16}
        borderRadius={999}
        alignItems="center"
        justifyContent="center"
        gap="$2"
        backgroundColor="$surface"
        borderWidth={1}
        borderColor="$border"
        opacity={busy ? 0.6 : 1}
        pressStyle={{ backgroundColor: '$bgSubtle' }}
      >
        <Text fontSize={20} fontWeight="700" color="#4285F4">
          G
        </Text>
        <Text color="$text" fontSize={15} fontWeight="600">
          {t('auth.continueWithGoogle')}
        </Text>
      </XStack>
    </Pressable>
  );
}

