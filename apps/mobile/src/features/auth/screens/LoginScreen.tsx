import { Link, router } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { HttpError } from '@/shared/lib/httpClient';
import { isRTL } from '@/shared/lib/i18n';
import { OutlinedInput } from '@/shared/ui/OutlinedInput';

// Raw RN inputs need a concrete family name per platform (web @font-face is
// "Rubik"; native loads weight-specific families).
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
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="$5"
      paddingTop={insets.top + 32}
      paddingBottom={insets.bottom + 20}
      width="100%"
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      <YStack width="100%" maxWidth={420} gap="$5">
        <YStack gap="$2" paddingTop="$6" paddingBottom="$2">
          <Text color="$text" fontSize={30} fontWeight="700" letterSpacing={-0.5} textAlign="center">
            {t('auth.welcomeTitle')}
          </Text>
          <Text color="$textMuted" fontSize={16} textAlign="center">
            {t('auth.loginSubtitle')}
          </Text>
        </YStack>

        <YStack gap={18}>
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

        <Pressable onPress={handleSubmit} disabled={disabled} style={{ width: '100%' }}>
          <YStack
            width="100%"
            height={54}
            borderRadius={20}
            alignItems="center"
            justifyContent="center"
            backgroundColor="$buttonPrimaryBg"
            opacity={disabled ? 0.55 : 1}
            shadowColor="$primary"
            shadowOpacity={0.35}
            shadowOffset={{ width: 0, height: 8 }}
            shadowRadius={16}
            elevation={6}
            pressStyle={{ backgroundColor: '$buttonPrimaryBgHover' }}
          >
            <Text color="$textOnPrimary" fontSize={18} fontWeight="700">
              {loading ? t('auth.signingIn') : t('auth.login')}
            </Text>
          </YStack>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setError(t('auth.forgotPasswordUnavailable'))}
          hitSlop={8}
          style={{ alignItems: 'center' }}
        >
          <Text color="$linkText" fontSize={15} fontWeight="600">
            {t('auth.forgotPassword')}
          </Text>
        </Pressable>

        <XStack alignItems="center" gap="$3">
          <YStack flex={1} height={1} backgroundColor="$border" />
          <Text color="$textMuted" fontSize={14}>
            {t('auth.or')}
          </Text>
          <YStack flex={1} height={1} backgroundColor="$border" />
        </XStack>

        <GoogleSignInButton variant="card" onError={(msg) => setError(msg || null)} />
      </YStack>

      <Link href={'/register' as never} asChild>
        <Pressable hitSlop={8} style={{ alignItems: 'center' }}>
          <XStack alignItems="center" gap={5}>
            <Text color="$textMuted" fontSize={15}>
              {t('auth.dontHaveAccount')}
            </Text>
            <Text color="$primary" fontSize={15} fontWeight="700">
              {t('auth.signUp')}
            </Text>
          </XStack>
        </Pressable>
      </Link>
    </YStack>
  );
}
