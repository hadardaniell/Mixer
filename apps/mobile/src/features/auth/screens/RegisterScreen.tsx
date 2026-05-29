import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { Eye, EyeOff } from 'lucide-react-native';

import { AuthLanguageToggle } from '@/features/auth/components/AuthLanguageToggle';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { AUTH_FONT_FAMILY, AUTH_USES_SYSTEM_FONT } from '@/features/auth/authFonts';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { HttpError } from '@/shared/lib/httpClient';
import { isRTL } from '@/shared/lib/i18n';
import { OutlinedInput } from '@/shared/ui/OutlinedInput';

export function RegisterScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isRtl = isRTL(language);

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
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="space-between"
      padding="2em"
      width="100%"
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
      <YStack width="100%" maxWidth={360} minWidth={0} gap="$4" paddingTop="1.5em">
        <AuthLanguageToggle language={language} onChangeLanguage={changeLanguage} />

        <XStack
          alignItems="flex-end"
          flexDirection={isRtl ? 'row' : 'row-reverse'}
          gap="$3"
          justifyContent="center"
          width="100%"
        >
          <Text
            color="#3D2314"
            flex={1}
            flexShrink={1}
            fontFamily={AUTH_FONT_FAMILY}
            fontSize={26}
            fontWeight="700"
            letterSpacing={-0.4}
            lineHeight={36}
            numberOfLines={1}
            paddingTop="0.5em"
            textAlign="center"
          >
            {t('auth.registerTitle')}
          </Text>
        </XStack>

        <YStack gap={22}>
          <OutlinedInput
            label={t('auth.displayName')}
            floatingLabel={false}
            autoCapitalize="words"
            value={displayName}
            onChangeText={setDisplayName}
            fontFamily={AUTH_FONT_FAMILY}
            useSystemFont={AUTH_USES_SYSTEM_FONT}
            style={{
              backgroundColor: 'transparent',
              borderColor: '#6F8286',
              borderRadius: 8,
              borderWidth: 1.5,
            }}
          />
          <OutlinedInput
            label={t('auth.email')}
            floatingLabel={false}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            fontFamily={AUTH_FONT_FAMILY}
            useSystemFont={AUTH_USES_SYSTEM_FONT}
            style={{
              backgroundColor: 'transparent',
              borderColor: '#6F8286',
              borderRadius: 8,
              borderWidth: 1.5,
            }}
          />
          <OutlinedInput
            label={t('auth.password')}
            floatingLabel={false}
            secureTextEntry={!passwordVisible}
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
            fontFamily={AUTH_FONT_FAMILY}
            useSystemFont={AUTH_USES_SYSTEM_FONT}
            style={{
              backgroundColor: 'transparent',
              borderColor: '#6F8286',
              borderRadius: 8,
              borderWidth: 1.5,
            }}
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
          <Text color="$dangerText" fontFamily={AUTH_FONT_FAMILY} fontSize="$3">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={loading || !email || !password || !displayName}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: pressed ? '#ffd7e7' : 'rgb(246, 235, 97)',
            borderRadius: 999,
            height: 55,
            justifyContent: 'center',
            opacity: loading ? 0.65 : 1,
            width: '100%',
          })}
        >
          <Text color="#2B1B10" fontFamily={AUTH_FONT_FAMILY} fontSize={21} fontWeight="800">
            {loading ? t('auth.signingUp') : t('auth.signUp')}
          </Text>
        </Pressable>

        <XStack alignItems="center" gap="$4">
          <YStack flex={1} height={1} backgroundColor="#c7c7c7" opacity={0.45} />
          <Text color="#16181F" fontFamily={AUTH_FONT_FAMILY} fontSize="$5">
            {t('auth.or')}
          </Text>
          <YStack flex={1} height={1} backgroundColor="#c7c7c7" opacity={0.45} />
        </XStack>

        <GoogleSignInButton variant="card" onError={(msg) => setError(msg || null)} />
      </YStack>

      <Link href={'/login' as never} asChild>
        <Pressable
          hitSlop={8}
          style={{
            alignSelf: 'center',
            bottom: 32,
            position: 'absolute',
          }}
        >
          <XStack alignItems="center" gap="0.3em">
            <Text color="#3D2314" fontFamily={AUTH_FONT_FAMILY} fontSize="$5">
              {t('auth.haveAccount')}
            </Text>
            <Text color="#3D2314" fontFamily={AUTH_FONT_FAMILY} fontSize="$5" fontWeight="800">
              {t('auth.login')}
            </Text>
          </XStack>
        </Pressable>
      </Link>
    </YStack>
  );
}
