import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { H1, Input, Text, YStack } from 'tamagui';

import { useSettings } from '@/features/settings/hooks/useSettings';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { HttpError } from '@/shared/lib/httpClient';

export function RegisterScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { language } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);

    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        locale: language,
      });
      signIn(res);
      router.replace('/home' as never);
    } catch (e) {
      if (e instanceof HttpError && e.status === 409) {
        setError(t('auth.emailAlreadyRegistered'));
      } else if (e instanceof HttpError && e.status === 400) {
        setError(t('auth.invalidInput'));
      } else {
        setError(t('auth.networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
      <H1>{t('auth.signUp')}</H1>

      <YStack width="100%" maxWidth={360} gap="$3">
        <Input
          placeholder={t('auth.displayName')}
          autoCapitalize="words"
          value={displayName}
          onChangeText={setDisplayName}
        />
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
          textContentType="newPassword"
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
          disabled={loading || !email || !password || !displayName}
          style={({ pressed }) => ({
            backgroundColor:
              loading || !email || !password || !displayName ? '#666' : pressed ? '#333' : '#111',
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 999,
            alignItems: 'center',
          })}
        >
          <Text color="white" fontSize="$5" fontWeight="600">
            {loading ? t('auth.signingUp') : t('auth.signUp')}
          </Text>
        </Pressable>

        <Link href={'/login' as never} asChild>
          <Pressable style={{ paddingVertical: 8, alignItems: 'center' }}>
            <Text fontSize="$3" color="$blue10">
              {t('auth.haveAccountSignIn')}
            </Text>
          </Pressable>
        </Link>
      </YStack>
    </YStack>
  );
}
