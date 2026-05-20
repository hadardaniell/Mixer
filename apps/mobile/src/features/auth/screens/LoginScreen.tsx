import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { H1, Input, Text, YStack } from 'tamagui';

import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { HttpError } from '@/shared/lib/httpClient';

export function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      signIn(res);
      router.replace('/home' as never);
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) {
        setError(t('auth.invalidCredentials'));
      } else {
        setError(t('auth.networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
      <H1>Mixer</H1>

      <YStack width="100%" maxWidth={360} gap="$3">
        <GoogleSignInButton onError={(msg) => setError(msg || null)} />

        <Text textAlign="center" color="$gray10" fontSize="$2">
          {t('auth.or')}
        </Text>

        <Input
          placeholder={t('auth.email')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          placeholder={t('auth.password')}
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={setPassword}
        />

        {error ? (
          <Text color="$red10" fontSize="$3">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={loading || !email || !password}
          style={({ pressed }) => ({
            backgroundColor: loading || !email || !password ? '#666' : pressed ? '#333' : '#111',
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 999,
            alignItems: 'center',
          })}
        >
          <Text color="white" fontSize="$5" fontWeight="600">
            {loading ? t('auth.signingIn') : t('auth.login')}
          </Text>
        </Pressable>

        <Link href={'/register' as never} asChild>
          <Pressable style={{ paddingVertical: 8, alignItems: 'center' }}>
            <Text fontSize="$3" color="$blue10">
              {t('auth.noAccountSignUp')}
            </Text>
          </Pressable>
        </Link>
      </YStack>
    </YStack>
  );
}
