import { router } from 'expo-router';
import { Phone, User } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, YStack } from 'tamagui';

import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { AuthPrimaryButton } from '@/features/auth/components/AuthPrimaryButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { tokens } from '@/features/auth/services/tokens';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { HttpError } from '@/shared/lib/httpClient';
import { isRTL } from '@/shared/lib/i18n';
import { OutlinedInput } from '@/shared/ui/OutlinedInput';

const INPUT_FONT = Platform.select({ web: 'Rubik', default: 'Rubik_400Regular' });

const HERO = require('../../../assets/images/register step 2.png');

/**
 * After Google sign-in, if the user has no phoneNumber (and possibly a default
 * display name) we route here to collect them before letting the user in.
 */
export function CompleteProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { language } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRtl = isRTL(language);
  const ink = theme.text?.val as string;
  const ready = !!displayName && !!phoneNumber;

  const handleSave = async () => {
    if (loading || !ready) return;
    setError(null);
    setLoading(true);
    try {
      const updated = await authApi.updateMe({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      // Persist the freshened user; tokens/refresh stay valid.
      tokens.setUser(updated);
      router.replace('/home' as never);
    } catch (e) {
      if (e instanceof HttpError && e.status === 409) {
        setError(t('auth.phoneAlreadyRegistered'));
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
      backgroundColor="$bg"
      paddingHorizontal={20}
      paddingTop={insets.top + 12}
      paddingBottom={insets.bottom + 16}
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      <YStack flex={1} width="100%" alignSelf="center" gap="$4">
        <AuthHeader onBack={() => router.back()} />

        {/* Same hero treatment as Register step 2: 16px gap from header,
            5px clipped off the top and bottom of the picture. */}
        <YStack width="100%" height={165} marginTop={16} overflow="hidden">
          <Image
            source={HERO}
            resizeMode="contain"
            style={{ width: '100%', height: 190, marginTop: -15 }}
          />
        </YStack>

        <YStack gap="$2" paddingTop="$4">
          <Text color="$text" fontSize={26} fontWeight="700" letterSpacing={-0.5} textAlign="center">
            {t('auth.completeProfileTitle')}
          </Text>
          <Text color="$textMuted" fontSize={15} textAlign="center">
            {t('auth.completeProfileSubtitle')}
          </Text>
        </YStack>

        <YStack gap={12}>
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

        {error ? (
          <Text color="$dangerText" fontSize="$3" textAlign={isRtl ? 'right' : 'left'}>
            {error}
          </Text>
        ) : null}

        <AuthPrimaryButton
          label={loading ? t('auth.saving') : t('auth.save')}
          onPress={handleSave}
          disabled={!ready || loading}
        />

        <Pressable hitSlop={8} onPress={() => router.back()} style={{ alignItems: 'center' }}>
          <Text color="$primary" fontSize={15} fontWeight="600">
            {t('auth.backToPrevious')}
          </Text>
        </Pressable>
      </YStack>
    </YStack>
  );
}
