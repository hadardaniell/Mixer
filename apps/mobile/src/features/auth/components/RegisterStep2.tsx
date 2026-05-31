import { Check, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable } from 'react-native';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { AuthPrimaryButton } from '@/features/auth/components/AuthPrimaryButton';
import { HaveAccountLink } from '@/features/auth/components/HaveAccountLink';
import { OutlinedInput } from '@/shared/ui/OutlinedInput';

const INPUT_FONT = Platform.select({ web: 'Rubik', default: 'Rubik_400Regular' });

interface RegisterStep2Props {
  password: string;
  confirmPassword: string;
  agreed: boolean;
  passwordVisible: boolean;
  confirmVisible: boolean;
  loading: boolean;
  error: string | null;
  onChangePassword: (v: string) => void;
  onChangeConfirmPassword: (v: string) => void;
  onToggleAgreed: () => void;
  onTogglePasswordVisible: () => void;
  onToggleConfirmVisible: () => void;
  onSubmit: () => void;
}

export function RegisterStep2({
  password,
  confirmPassword,
  agreed,
  passwordVisible,
  confirmVisible,
  loading,
  error,
  onChangePassword,
  onChangeConfirmPassword,
  onToggleAgreed,
  onTogglePasswordVisible,
  onToggleConfirmVisible,
  onSubmit,
}: RegisterStep2Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const ink = theme.text?.val as string;
  const muted = theme.textMuted?.val as string;
  const success = theme.success?.val as string;

  const passwordValid = password.length >= 8;
  const confirmMismatch = !!confirmPassword && confirmPassword !== password;
  const ready = passwordValid && !!confirmPassword && agreed && !confirmMismatch;

  return (
    <YStack flex={1} justifyContent="space-between" gap={16}>
      {/* Top group: title → progress → password+confirm → terms checkbox */}
      <YStack gap={18}>
        {/* Title + subtitle */}
        <YStack gap="$1">
          <Text color="$text" fontSize={26} fontWeight="700" letterSpacing={-0.5} textAlign="center">
            {t('auth.registerStep2Title')}
          </Text>
          <Text color="$textMuted" fontSize={15} textAlign="center">
            {t('auth.registerStep2Subtitle')}
          </Text>
        </YStack>

        {/* Step indicator + progress */}
        <YStack gap="$2" alignItems="center">
          <Text color="$primary" fontSize={14} fontWeight="600">
            {t('auth.stepIndicator', { current: 2, total: 2 })}
          </Text>
          <View width="100%" height={6} borderRadius={999} backgroundColor="$bgSubtle" overflow="hidden">
            <View height={6} borderRadius={999} backgroundColor="$primary" width="100%" />
          </View>
        </YStack>

        {/* Fields */}
        <YStack gap={12}>
          <YStack gap="$2">
            <OutlinedInput
              label={t('auth.password')}
              floatingLabel={false}
              secureTextEntry={!passwordVisible}
              textContentType="newPassword"
              value={password}
              onChangeText={onChangePassword}
              fontFamily={INPUT_FONT}
              style={{ borderRadius: 14 }}
              startAdornment={<Lock size={22} color={ink} />}
              endAdornment={
                <Pressable accessibilityRole="button" onPress={onTogglePasswordVisible} hitSlop={10}>
                  {passwordVisible ? <Eye color={muted} size={24} /> : <EyeOff color={muted} size={24} />}
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
            onChangeText={onChangeConfirmPassword}
            fontFamily={INPUT_FONT}
            style={{ borderRadius: 14 }}
            error={confirmMismatch}
            startAdornment={<ShieldCheck size={22} color={ink} />}
            endAdornment={
              <Pressable accessibilityRole="button" onPress={onToggleConfirmVisible} hitSlop={10}>
                {confirmVisible ? <Eye color={muted} size={24} /> : <EyeOff color={muted} size={24} />}
              </Pressable>
            }
          />

          {/* Terms checkbox */}
          <XStack alignItems="center" gap="$3">
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              onPress={onToggleAgreed}
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

        {error ? (
          <Text color="$dangerText" fontSize="$3">
            {error}
          </Text>
        ) : null}
      </YStack>

      {/* Bottom group: Create account + "have an account?" link, flex column */}
      <YStack gap={16} paddingBottom={16}>
        <AuthPrimaryButton
          label={loading ? t('auth.signingUp') : t('auth.createAccount')}
          onPress={onSubmit}
          disabled={!ready || loading}
        />
        <HaveAccountLink />
      </YStack>
    </YStack>
  );
}
