import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';

<<<<<<< HEAD
import { AUTH_FONT_FAMILY } from '@/features/auth/authFonts';
=======
>>>>>>> 1acc038dba37cfd30d15e42a72fbe1f7ab5abfb1
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import {
  GoogleSignInCancelledError,
  signInWithGoogle,
} from '@/features/auth/services/googleSignIn';
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
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    onError('');
    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
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
<<<<<<< HEAD
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
=======
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
        opacity={loading ? 0.6 : 1}
        pressStyle={{ backgroundColor: '$bgSubtle' }}
      >
        <Text fontSize={20} fontWeight="700" color="#4285F4">
          G
        </Text>
        <Text color="$text" fontSize={15} fontWeight="600">
>>>>>>> 1acc038dba37cfd30d15e42a72fbe1f7ab5abfb1
          {t('auth.continueWithGoogle')}
        </Text>
      </XStack>
    </Pressable>
  );
}
