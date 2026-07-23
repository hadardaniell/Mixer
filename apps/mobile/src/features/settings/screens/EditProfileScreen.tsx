import { router } from 'expo-router';
import { Mail, Phone, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthPrimaryButton } from '@/features/auth/components/AuthPrimaryButton';
import { SettingsHeader } from '@/features/settings/components/SettingsHeader';
import { useUpdateProfile } from '@/features/settings/hooks/useProfileMutations';
import { useIsRtl } from '@/shared/lib/useIsRtl';
import { OutlinedInput } from '@/shared/ui/OutlinedInput';

const MAX_NAME = 80;

/**
 * Account details form.
 *
 * Only the display name is editable: `PATCH /users/me` also accepts a phone
 * number, but the phone drives contacts-based friend discovery, so it's shown
 * read-only here. Email can't be changed at all — there's no server flow for it.
 * The avatar lives on the profile screen behind its camera badge.
 */
export function EditProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isRtl = useIsRtl();
  const { user } = useAuth();
  const update = useUpdateProfile();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');

  const trimmed = displayName.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= MAX_NAME;
  const isDirty = trimmed !== (user?.displayName ?? '');

  const save = () => {
    if (!isValid || !isDirty || update.isPending) return;
    update.mutate(
      { displayName: trimmed },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg?.val as string }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack
          flex={1}
          paddingHorizontal={20}
          gap={18}
          justifyContent="space-between"
          style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
        >
          <YStack gap={18}>
            <SettingsHeader title={t('settings.profile.title')} />

            <YStack gap={12}>
              <FieldLabel text={t('settings.profile.displayName')} />
              <OutlinedInput
                label={t('settings.profile.displayNamePlaceholder')}
                floatingLabel={false}
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={MAX_NAME}
                autoCapitalize="words"
                error={displayName.length > 0 && !isValid}
                style={{ borderRadius: 14 }}
                startAdornment={<UserRound size={24} color={theme.text?.val as string} />}
              />
            </YStack>

            <YStack gap={12}>
              <FieldLabel text={t('settings.profile.contact')} />
              <ReadOnlyField
                icon={<Mail size={20} color={theme.textMuted?.val as string} />}
                value={user?.email ?? ''}
              />
              {user?.phoneNumber ? (
                <ReadOnlyField
                  icon={<Phone size={20} color={theme.textMuted?.val as string} />}
                  value={user.phoneNumber}
                />
              ) : null}
              <Text fontSize={13} color="$textMuted">
                {t('settings.profile.contactHint')}
              </Text>
            </YStack>

            {update.isError ? (
              <Text fontSize={13} color="$danger">
                {t('settings.profile.saveFailed')}
              </Text>
            ) : null}
          </YStack>

          <AuthPrimaryButton
            label={update.isPending ? t('settings.profile.saving') : t('common.save')}
            onPress={save}
            disabled={!isValid || !isDirty || update.isPending}
          />
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ text }: { text: string }) {
  return (
    <Text fontSize={15} fontWeight="600" color="$text">
      {text}
    </Text>
  );
}

/** Non-editable value, styled like a muted input so the form reads as one block. */
function ReadOnlyField({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <XStack
      alignItems="center"
      gap="$3"
      height={56}
      paddingHorizontal={14}
      borderRadius={14}
      borderWidth={1}
      borderColor="$border"
      backgroundColor="$bgSubtle"
    >
      {icon}
      <Text fontSize={15} color="$textMuted" flex={1} numberOfLines={1}>
        {value}
      </Text>
    </XStack>
  );
}
