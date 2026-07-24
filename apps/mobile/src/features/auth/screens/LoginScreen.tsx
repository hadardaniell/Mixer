import { router } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { AuthPrimaryButton } from '@/features/auth/components/AuthPrimaryButton';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { NoAccountLink } from '@/features/auth/components/NoAccountLink';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { HttpError } from '@/shared/lib/httpClient';
import { isRTL } from '@/shared/lib/i18n';
import { MixerBowl } from '@/shared/ui/MixerBowl';
import { OutlinedInput } from '@/shared/ui/OutlinedInput';

const INPUT_FONT = Platform.select({ web: 'Rubik', default: 'Rubik_400Regular' });

export function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { signIn } = useAuth();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isRtl = isRTL(language);
  const muted = theme.textMuted?.val as string;
  const disabled = loading || !identifier || !password;

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      // A value containing "@" is treated as an email, otherwise as a phone.
      const id = identifier.trim();
      const credential = id.includes('@') ? { email: id } : { phoneNumber: id };
      const res = await authApi.login({ ...credential, password });
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
      backgroundColor="$bg"
      paddingHorizontal={20}
      paddingTop={insets.top + 10}
      paddingBottom={insets.bottom + 12}
    >
      <YStack
        flex={1}
        width="100%"
        // maxWidth={440}
        alignSelf="center"
        style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
      >
        <YStack flex={1}>
          {/* Back-only header (no language controls on login). */}
          <AuthHeader onBack={() => router.back()} showLanguageControls={false} />

          {/* The Mixer mark — the same bowl as Start, as a still logo. */}
          <YStack alignItems="center" marginTop={24}>
            <MixerBowl size={92} />
          </YStack>

          {/* Form area: flex column with space-between (top = title/fields/google,
              bottom = login button + "don't have account" link). */}
          <YStack flex={1} marginTop="$4" justifyContent="space-between" gap={16}>
            <YStack gap={18}>
              {/* Title + subtitle */}
              <YStack gap="$1">
                <Text color="$text" fontSize={26} fontWeight="700" letterSpacing={-0.5} textAlign="center">
                  {t('auth.welcomeTitle')}
                </Text>
                <Text color="$textMuted" fontSize={15} textAlign="center">
                  {t('auth.loginSubtitle')}
                </Text>
              </YStack>

              {/* Fields */}
              <YStack gap={12}>
                <OutlinedInput
                  label={t('auth.emailOrPhone')}
                  floatingLabel={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  value={identifier}
                  onChangeText={setIdentifier}
                  fontFamily={INPUT_FONT}
                  style={{ borderRadius: 14 }}
                />
                <OutlinedInput
                  label={t('auth.password')}
                  floatingLabel={false}
                  secureTextEntry={!passwordVisible}
                  textContentType="password"
                  value={password}
                  onChangeText={setPassword}
                  fontFamily={INPUT_FONT}
                  style={{ borderRadius: 14 }}
                  endAdornment={
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setPasswordVisible((v) => !v)}
                      hitSlop={10}
                    >
                      {passwordVisible ? (
                        <Eye color={muted} size={24} />
                      ) : (
                        <EyeOff color={muted} size={24} />
                      )}
                    </Pressable>
                  }
                />
              </YStack>

              {error ? (
                <Text color="$dangerText" fontSize="$3" textAlign={isRtl ? 'right' : 'left'}>
                  {error}
                </Text>
              ) : null}

              {/* "or" divider + Google */}
              <YStack gap="$2">
                <XStack alignItems="center" gap={16}>
                  <YStack flex={1} height={1} backgroundColor="$border" />
                  <Text color="$textMuted" fontSize={14}>
                    {t('auth.or')}
                  </Text>
                  <YStack flex={1} height={1} backgroundColor="$border" />
                </XStack>
                <GoogleSignInButton variant="card" onError={(msg) => setError(msg || null)} />
              </YStack>
            </YStack>

            {/* Bottom group: Login button + "don't have account?" link */}
            <YStack gap={16} paddingBottom={16}>
              <AuthPrimaryButton
                label={loading ? t('auth.signingIn') : t('auth.login')}
                onPress={handleSubmit}
                disabled={disabled}
              />
              <NoAccountLink />
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  );
}
