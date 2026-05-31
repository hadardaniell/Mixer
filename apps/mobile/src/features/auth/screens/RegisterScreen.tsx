import { Link, router } from 'expo-router';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { AuthLanguageToggle } from '@/features/auth/components/AuthLanguageToggle';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { HttpError } from '@/shared/lib/httpClient';
import { isRTL } from '@/shared/lib/i18n';
import { OutlinedInput } from '@/shared/ui/OutlinedInput';

const INPUT_FONT = Platform.select({ web: 'Rubik', default: 'Rubik_400Regular' });

const HERO = {
  1: require('../../../assets/images/register step 1.png'),
  2: require('../../../assets/images/register step 2.png'),
} as const;

export function RegisterScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { signIn } = useAuth();
  const { language, changeLanguage } = useLanguage();
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
  const ink = theme.text?.val as string;
  const muted = theme.textMuted?.val as string;
  const success = theme.success?.val as string;

  const passwordValid = password.length >= 8;
  const step1Ready = !!displayName && !!email && !!phoneNumber;
  const step2Ready = passwordValid && !!confirmPassword && agreed;

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

    if (!passwordValid) {
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

  const toggleLanguage = () => changeLanguage(language === 'he' ? 'en' : 'he');

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
          maxWidth={440}
          alignSelf="center"
          justifyContent="space-between"
          gap="$4"
          style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
        >
          <YStack gap="$4">
            {/* Header — language controls pinned left, back pinned right
                (forced LTR so the sides never flip with the app language). */}
            <XStack
              width="100%"
              alignItems="center"
              justifyContent="space-between"
              style={{ direction: 'ltr' } as never}
            >
              <XStack alignItems="center" gap="$2">
                {/* <CircleButton onPress={toggleLanguage}> */}
                  <Globe size={22} color={ink} />
                {/* </CircleButton> */}
                <AuthLanguageToggle language={language} onChangeLanguage={changeLanguage} />
              </XStack>
              <Pressable accessibilityRole="button" onPress={handleBack} hitSlop={8}>
                <ArrowRight size={26} color={ink} />
              </Pressable>
            </XStack>

            {/* Hero */}
            <Image
              source={HERO[step]}
              resizeMode="contain"
              style={{ width: '100%', height: 200 }}
            />

            {/* Title + subtitle */}
            <YStack gap="$2">
              <Text color="$text" fontSize={30} fontWeight="700" letterSpacing={-0.5} textAlign="center">
                {step === 1 ? t('auth.registerTitle') : t('auth.registerStep2Title')}
              </Text>
              {/* <Text color="$textMuted" fontSize={16} textAlign="center">
                {step === 1 ? t('auth.registerSubtitle') : t('auth.registerStep2Subtitle')}
              </Text> */}
            </YStack>

            {/* Step indicator + progress */}
            <YStack gap="$2" alignItems="center">
              <Text color="$primary" fontSize={14} fontWeight="600">
                {t('auth.stepIndicator', { current: step, total: 2 })}
              </Text>
              <View width="100%" height={6} borderRadius={999} backgroundColor="$bgSubtle" overflow="hidden">
                <View
                  height={6}
                  borderRadius={999}
                  backgroundColor="$primary"
                  width={step === 1 ? '50%' : '100%'}
                />
              </View>
            </YStack>

            {/* Fields */}
            {step === 1 ? (
              <YStack gap={14}>
                <OutlinedInput
                  label={t('auth.displayName')}
                  floatingLabel={false}
                  autoCapitalize="words"
                  value={displayName}
                  onChangeText={setDisplayName}
                  fontFamily={INPUT_FONT}
                  style={{ borderRadius: 14 }}
                  startAdornment={<User size={22} color={ink} />}
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
                  fontFamily={INPUT_FONT}
                  style={{ borderRadius: 14 }}
                  startAdornment={<Mail size={22} color={ink} />}
                />
                <OutlinedInput
                  label={t('auth.phoneNumber')}
                  floatingLabel={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  fontFamily={INPUT_FONT}
                  style={{ borderRadius: 14 }}
                  startAdornment={<Phone size={22} color={ink} />}
                />
              </YStack>
            ) : (
              <YStack gap={14}>
                <YStack gap="$2">
                  <OutlinedInput
                    label={t('auth.password')}
                    floatingLabel={false}
                    secureTextEntry={!passwordVisible}
                    textContentType="newPassword"
                    value={password}
                    onChangeText={setPassword}
                    fontFamily={INPUT_FONT}
                    style={{ borderRadius: 14 }}
                    startAdornment={<Lock size={22} color={ink} />}
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
                  <XStack alignItems="center" gap="$2">
                    <Check size={16} color={passwordValid ? success : muted} />
                    <Text color={passwordValid ? '$success' : '$textMuted'} fontSize={13}>
                      {t('auth.passwordMinHint')}
                    </Text>
                  </XStack>
                </YStack>

                <OutlinedInput
                  label={t('auth.confirmPassword')}
                  floatingLabel={false}
                  secureTextEntry={!confirmVisible}
                  textContentType="newPassword"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  fontFamily={INPUT_FONT}
                  style={{ borderRadius: 14 }}
                  error={!!confirmPassword && confirmPassword !== password}
                  startAdornment={<ShieldCheck size={22} color={ink} />}
                  endAdornment={
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setConfirmVisible((v) => !v)}
                      hitSlop={10}
                    >
                      {confirmVisible ? (
                        <Eye color={muted} size={24} />
                      ) : (
                        <EyeOff color={muted} size={24} />
                      )}
                    </Pressable>
                  }
                />

                {/* Terms checkbox */}
                <XStack alignItems="center" gap="$3" paddingVertical="$1">
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: agreed }}
                    onPress={() => setAgreed((v) => !v)}
                    hitSlop={6}
                  >
                    <View
                      width={24}
                      height={24}
                      borderRadius={7}
                      borderWidth={1.5}
                      borderColor={agreed ? '$primary' : '$border'}
                      backgroundColor={agreed ? '$primary' : 'transparent'}
                      alignItems="center"
                      justifyContent="center"
                    >
                      {agreed ? <Check size={16} color="#FFFFFF" /> : null}
                    </View>
                  </Pressable>
                  <Text color="$textMuted" fontSize={13} flex={1}>
                    {t('auth.agreePrefix')}{' '}
                    <Text color="$primary" fontWeight="600">
                      {t('auth.termsOfUse')}
                    </Text>
                    {t('auth.agreeConnector')}
                    <Text color="$primary" fontWeight="600">
                      {t('auth.privacyPolicy')}
                    </Text>
                  </Text>
                </XStack>
              </YStack>
            )}

            {error ? (
              <Text color="$dangerText" fontSize="$3" textAlign={isRtl ? 'right' : 'left'}>
                {error}
              </Text>
            ) : null}

            {/* Google + or (step 1 only) */}
            {step === 1 ? (
              <YStack gap="$3">
                <XStack alignItems="center" gap="$3">
                  <YStack flex={1} height={1} backgroundColor="$border" />
                  <Text color="$textMuted" fontSize={14}>
                    {t('auth.or')}
                  </Text>
                  <YStack flex={1} height={1} backgroundColor="$border" />
                </XStack>
                <GoogleSignInButton variant="card" onError={(msg) => setError(msg || null)} />
              </YStack>
            ) : null}

            {/* Primary action */}
            {step === 1 ? (
              <PrimaryButton label={t('auth.continue')} onPress={goToStep2} disabled={!step1Ready} />
            ) : (
              <PrimaryButton
                label={loading ? t('auth.signingUp') : t('auth.createAccount')}
                onPress={handleSubmit}
                disabled={!step2Ready || loading}
              />
            )}
          </YStack>

          {/* Footer links */}
          <YStack gap="$3" alignItems="center" paddingTop="$3">
            <Link href={'/login' as never} asChild>
              <Pressable hitSlop={8}>
                <XStack alignItems="center" gap={5}>
                  <Text color="$textMuted" fontSize={15}>
                    {t('auth.haveAccount')}
                  </Text>
                  <Text color="$primary" fontSize={15} fontWeight="700">
                    {t('auth.login')}
                  </Text>
                </XStack>
              </Pressable>
            </Link>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ width: '100%' }}>
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
          {label}
        </Text>
      </YStack>
    </Pressable>
  );
}

function CircleButton({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={6}>
      <View
        width={44}
        height={44}
        borderRadius={22}
        borderWidth={1}
        borderColor="$border"
        backgroundColor="$surface"
        alignItems="center"
        justifyContent="center"
        pressStyle={{ backgroundColor: '$bgSubtle' }}
      >
        {children}
      </View>
    </Pressable>
  );
}
