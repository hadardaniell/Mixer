//apps/mobile/src/features/book/components/Step3Share.tsx
import { Check, Lock, Users } from 'lucide-react-native';
import type { Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { ManualTextInput } from '@/features/recipe/components/manual/ManualTextInput';
import { useIsRtl } from '@/shared/lib/useIsRtl';

import type { BookForm, BookFormAction, BookPrivacy } from '../lib/bookForm';
import { BookStepShell } from './BookStepShell';
import { useState } from 'react';
import { AddBookMembersSheet } from './AddBookMembersSheet';

interface Props {
  form: BookForm;
  dispatch: Dispatch<BookFormAction>;
}

/** Step 3 — privacy choice + (stubbed) friend invite. */
export function Step3Share({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;
  const setPrivacy = (privacy: BookPrivacy) => dispatch({ type: 'patch', value: { privacy } });
  const [membersOpen, setMembersOpen] = useState(false);

  return (
    <>
      <BookStepShell
        Icon={Users}
        iconBg="$accentPink"
        title={t('createBook.step3.title')}
        subtitle={t('createBook.step3.subtitle')}
      >
        <YStack gap="$4" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
          <XStack gap="$3">
            <PrivacyCard
              Icon={Lock}
              ink={ink}
              label={t('createBook.step3.private')}
              desc={t('createBook.step3.privateDesc')}
              selected={form.privacy === 'personal'}
              onPress={() => setPrivacy('personal')}
              checkColor={theme.textOnPrimary?.val as string}
            />
            <PrivacyCard
              Icon={Users}
              ink={ink}
              label={t('createBook.step3.shared')}
              desc={t('createBook.step3.sharedDesc')}
              selected={form.privacy === 'shared'}
              onPress={() => setPrivacy('shared')}
              checkColor={theme.textOnPrimary?.val as string}
            />
          </XStack>

          {form.privacy === 'shared' ? (
            <YStack gap="$3">
              <Text color="$text" fontSize={15} fontWeight="700">
                {t('createBook.step3.inviteLabel')}
              </Text>

              <XStack
                onPress={() => setMembersOpen(true)}
                borderWidth={1}
                borderColor="$border"
                backgroundColor="$surface"
                borderRadius={16}
                padding="$3"
                alignItems="center"
                justifyContent="space-between"
              >
                <YStack flex={1}>
                  <Text color="$text" fontSize={15} fontWeight="600">
                    {form.invitedIds.length > 0
                      ? `${form.invitedIds.length} ${t('createBook.step3.membersSelected')}`
                      : t('createBook.step3.invitePlaceholder')}
                  </Text>

                  {form.invitedIds.length === 0 ? (
                    <Text color="$textMuted" fontSize={12} marginTop="$1">
                      {t('createBook.step3.inviteHint')}
                    </Text>
                  ) : null}
                </YStack>

                <Text color="$primary" fontSize={14} fontWeight="700">
                  {t('createBook.step3.chooseMembers')}
                </Text>
              </XStack>
            </YStack>
          ) : null}

          <Text color="$textSubtle" fontSize={13} textAlign="center">
            {t('createBook.step3.skipHint')}
          </Text>
        </YStack>
      </BookStepShell>
      <AddBookMembersSheet
        open={membersOpen}
        onOpenChange={setMembersOpen}
        existingMemberIds={form.invitedIds}
        busy={false}
        onConfirm={(userIds, role) => {
          dispatch({ type: 'setInvites', ids: userIds });
          dispatch({ type: 'setInviteRole', role });
          setMembersOpen(false);
        }}
      />
    </>
  );
}

function PrivacyCard({
  Icon,
  ink,
  label,
  desc,
  selected,
  onPress,
  checkColor,
}: {
  Icon: typeof Lock;
  ink: string;
  label: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
  checkColor: string;
}) {
  return (
    <YStack
      flex={1}
      onPress={onPress}
      borderRadius={18}
      borderWidth={1}
      borderColor={selected ? '$accentCoral' : '$border'}
      backgroundColor={selected ? '$accentPink' : '$surface'}
      padding="$3"
      gap="$2"
      alignItems="center"
      pressStyle={{ opacity: 0.9 }}
    >
      {selected ? (
        <YStack
          position="absolute"
          top={8}
          end={8}
          width={22}
          height={22}
          borderRadius={999}
          backgroundColor="$accentCoral"
          alignItems="center"
          justifyContent="center"
        >
          <Check size={13} color={checkColor} strokeWidth={3} />
        </YStack>
      ) : null}
      <Icon size={26} color={ink} strokeWidth={1.8} />
      <Text color="$text" fontSize={15} fontWeight="700" textAlign="center">
        {label}
      </Text>
      <Text color="$textMuted" fontSize={12} textAlign="center" lineHeight={16}>
        {desc}
      </Text>
    </YStack>
  );
}
