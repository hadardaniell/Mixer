import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';

import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { RegisterStep1 } from '@/features/auth/components/RegisterStep1';
import { RegisterStep2 } from '@/features/auth/components/RegisterStep2';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { HttpError } from '@/shared/lib/httpClient';
import { isRTL } from '@/shared/lib/i18n';

const HERO = {
  1: require('../../../assets/images/register step 1.png'),
  2: require('../../../assets/images/register step 2.png'),
} as const;

export function RegisterScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRtl = isRTL(language);

  const step1Ready = !!displayName && !!email && !!phoneNumber;

  const goToStep2 = () => {
    if (!step1Ready) return;
    setError(null);
    setStep(2);
  };

  const goToStep1 = () => {
    setError(null);
    setStep(1);
  };

  // Back always returns to the previous page: step 2 → step 1, step 1 → start.
  const handleBack = () => {
    if (step === 2) {
      goToStep1();
      return;
    }
    router.back();
  };

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);

    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDontMatch'));
      return;
    }
    if (!agreed) {
      setError(t('auth.mustAcceptTerms'));
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        locale: language,
      });
      signIn(res);
      router.replace('/home' as never);
    } catch (e) {
      if (e instanceof HttpError && e.status === 409) {
        // Backend returns { error: 'email_already_registered' | 'phone_already_registered' }
        const code = (e.body as { error?: string } | undefined)?.error;
        if (code === 'phone_already_registered') {
          setError(t('auth.phoneAlreadyRegistered'));
        } else {
          setError(t('auth.emailAlreadyRegistered'));
        }
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
    <YStack flex={1} backgroundColor="$bg">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <YStack
          flex={1}
          width="100%"
          // maxWidth={440}
          alignSelf="center"
          justifyContent="space-between"
          style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
        >
          <YStack flex={1}>
            <AuthHeader onBack={handleBack} />

            {/* 1em (16px) gap between the header and the hero image.
                Wrapper clips 5px off the top and bottom of the picture
                without changing its proportions. */}
            <YStack width="100%" height={165} marginTop={16} overflow="hidden">
              <Image
                source={HERO[step]}
                resizeMode="contain"
                style={{ width: '100%', height: 190, marginTop: -15 }}
              />
            </YStack>

            <YStack flex={1} marginTop="$4">
              {step === 1 ? (
                <RegisterStep1
                  displayName={displayName}
                  email={email}
                  phoneNumber={phoneNumber}
                  error={error}
                  onChangeDisplayName={setDisplayName}
                  onChangeEmail={setEmail}
                  onChangePhoneNumber={setPhoneNumber}
                  onContinue={goToStep2}
                  onGoogleError={(msg) => setError(msg || null)}
                />
              ) : (
                <RegisterStep2
                  password={password}
                  confirmPassword={confirmPassword}
                  agreed={agreed}
                  passwordVisible={passwordVisible}
                  confirmVisible={confirmVisible}
                  loading={loading}
                  error={error}
                  onChangePassword={setPassword}
                  onChangeConfirmPassword={setConfirmPassword}
                  onToggleAgreed={() => setAgreed((v) => !v)}
                  onTogglePasswordVisible={() => setPasswordVisible((v) => !v)}
                  onToggleConfirmVisible={() => setConfirmVisible((v) => !v)}
                  onSubmit={handleSubmit}
                />
              )}
            </YStack>
          </YStack>

          {/* Each step owns its own "have an account" link in its bottom group. */}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
