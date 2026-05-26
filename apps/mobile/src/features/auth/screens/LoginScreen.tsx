import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { Eye, EyeOff } from 'lucide-react-native';

import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { HttpError } from '@/shared/lib/httpClient';
import { isRTL } from '@/shared/lib/i18n';
import { OutlinedInput } from '@/shared/ui/OutlinedInput';

export function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isRtl = isRTL(language);

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
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="space-between"
      padding="2em"
      width="100%"
      backgroundColor="#FFFFFF"
      style={
        {
          boxSizing: 'border-box',
          direction: isRtl ? 'rtl' : 'ltr',
          minHeight: '100dvh',
          overflowX: 'hidden',
          position: 'relative',
        } as never
      }
    >
      <YStack width="100%" maxWidth={420} gap="$5" paddingTop="5em">
        <XStack
          alignItems="flex-end"
          flexDirection={isRtl ? 'row' : 'row-reverse'}
          justifyContent="space-between"
        >
          <Text
            color="#242424"
            fontFamily="Heebo"
            fontSize={30}
            fontWeight="700"
            letterSpacing={-0.4}
            lineHeight={36}
            textAlign={isRtl ? 'right' : 'left'}
          >
            {t('auth.welcomeTitle')}
          </Text>
        </XStack>

        <YStack gap={22}>
          <OutlinedInput
            label={t('auth.email')}
            floatingLabel={false}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            style={{ borderColor: '#6F8286', borderRadius: 8, borderWidth: 1.5 }}
          />
          <OutlinedInput
            label={t('auth.password')}
            floatingLabel={false}
            secureTextEntry={!passwordVisible}
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            style={{ borderColor: '#6F8286', borderRadius: 8, borderWidth: 1.5 }}
            endAdornment={
              <Pressable
                accessibilityRole="button"
                onPress={() => setPasswordVisible((current) => !current)}
                hitSlop={10}
              >
                {passwordVisible ? (
                  <Eye color="#6F8286" size={26} />
                ) : (
                  <EyeOff color="#6F8286" size={26} />
                )}
              </Pressable>
            }
          />
        </YStack>

        {error ? (
          <Text color="$dangerText" fontSize="$3">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={loading || !email || !password}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: pressed ? '#B9EA13E6' : '#C8FA15E6',
            borderRadius: 999,
            height: 55,
            justifyContent: 'center',
            opacity: loading ? 0.65 : 1,
            width: '100%',
          })}
        >
          <Text color="#1f3d00" fontFamily="Heebo" fontSize={21} fontWeight="800">
            {loading ? t('auth.signingIn') : t('auth.login')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setError(t('auth.forgotPasswordUnavailable'))}
          hitSlop={8}
          style={{ alignItems: 'center' }}
        >
          <Text color="#16181F" fontSize="$5">
            {t('auth.forgotPassword')}
          </Text>
        </Pressable>

        <XStack alignItems="center" gap="$4">
          <YStack flex={1} height={1} backgroundColor="#c7c7c7" opacity={0.45} />
          <Text color="#16181F" fontSize="$5">
            {t('auth.or')}
          </Text>
          <YStack flex={1} height={1} backgroundColor="#c7c7c7" opacity={0.45} />
        </XStack>

        <GoogleSignInButton variant="card" onError={(msg) => setError(msg || null)} />
      </YStack>

      <Link href={'/register' as never} asChild>
        <Pressable
          hitSlop={8}
          style={{
            alignSelf: 'center',
            bottom: 32,
            position: 'absolute',
          }}
        >
          <XStack alignItems="center" gap="0.3em">
            <Text color="#16181F" fontFamily="Heebo" fontSize="$5">
              {t('auth.dontHaveAccount')}
            </Text>
            <Text color="#1f3d00" fontFamily="Heebo" fontSize="$5" fontWeight="800">
              {t('auth.signUp')}
            </Text>
          </XStack>
        </Pressable>
      </Link>
    </YStack>
  );
}
