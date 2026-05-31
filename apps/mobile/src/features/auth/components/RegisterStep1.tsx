import { Mail, Phone, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { AuthPrimaryButton } from '@/features/auth/components/AuthPrimaryButton';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { HaveAccountLink } from '@/features/auth/components/HaveAccountLink';
import { OutlinedInput } from '@/shared/ui/OutlinedInput';

const INPUT_FONT = Platform.select({ web: 'Rubik', default: 'Rubik_400Regular' });

interface RegisterStep1Props {
  displayName: string;
  email: string;
  phoneNumber: string;
  error: string | null;
  onChangeDisplayName: (v: string) => void;
  onChangeEmail: (v: string) => void;
  onChangePhoneNumber: (v: string) => void;
  onContinue: () => void;
  onGoogleError: (message: string | null) => void;
}

export function RegisterStep1({
  displayName,
  email,
  phoneNumber,
  error,
  onChangeDisplayName,
  onChangeEmail,
  onChangePhoneNumber,
  onContinue,
  onGoogleError,
}: RegisterStep1Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const ink = theme.text?.val as string;
  const ready = !!displayName && !!email && !!phoneNumber;

  return (
    <YStack flex={1} justifyContent="space-between" gap={16}>
      {/* Top group: title → progress → fields → Google + or */}
      <YStack gap={18}>
        {/* Title */}
        <YStack gap="$1">
          <Text color="$text" fontSize={26} fontWeight="700" letterSpacing={-0.5} textAlign="center">
            {t('auth.registerTitle')}
          </Text>
        </YStack>

        {/* Step indicator + progress */}
        <YStack gap="$2" alignItems="center">
          <Text color="$primary" fontSize={14} fontWeight="600">
            {t('auth.stepIndicator', { current: 1, total: 2 })}
          </Text>
          <View width="100%" height={6} borderRadius={999} backgroundColor="$bgSubtle" overflow="hidden">
            <View height={6} borderRadius={999} backgroundColor="$primary" width="50%" />
          </View>
        </YStack>

        {/* Fields */}
        <YStack gap={12}>
          <OutlinedInput
            label={t('auth.displayName')}
            floatingLabel={false}
            autoCapitalize="words"
            value={displayName}
            onChangeText={onChangeDisplayName}
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
            onChangeText={onChangeEmail}
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
            onChangeText={onChangePhoneNumber}
            fontFamily={INPUT_FONT}
            style={{ borderRadius: 14 }}
            startAdornment={<Phone size={22} color={ink} />}
          />
        </YStack>

        {error ? (
          <Text color="$dangerText" fontSize="$3">
            {error}
          </Text>
        ) : null}

        {/* Google + or */}
        <YStack gap="$2">
          <XStack alignItems="center" gap={16}>
            <YStack flex={1} height={1} backgroundColor="$border" />
            <Text color="$textMuted" fontSize={14}>
              {t('auth.or')}
            </Text>
            <YStack flex={1} height={1} backgroundColor="$border" />
          </XStack>
          <GoogleSignInButton variant="card" onError={onGoogleError} />
        </YStack>
      </YStack>

      {/* Bottom group: Continue + "have an account?" link, flex column */}
      <YStack gap={16} paddingBottom={16}>
        <AuthPrimaryButton label={t('auth.continue')} onPress={onContinue} disabled={!ready} />
        <HaveAccountLink />
      </YStack>
    </YStack>
  );
}
