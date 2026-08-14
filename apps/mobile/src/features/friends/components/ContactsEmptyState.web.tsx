import { Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, YStack } from 'tamagui';

import { ConceptualIcon } from '@/shared/ui/ConceptualIcon';

/**
 * Browser counterpart to the contacts flow — which the web simply doesn't get.
 * There is no address book to read in a browser, so instead of offering a
 * button that can only fail, this points the user at the search field above,
 * which matches on display name or an exact phone number.
 */
export function ContactsEmptyState() {
  const { t } = useTranslation();

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$5" gap="$3">
      <ConceptualIcon Icon={Users} blobColor="$accentMint" variant={1} size={92} />
      <Text color="$text" fontSize={16} fontWeight="700" textAlign="center">
        {t('friends.searchPrompt.title')}
      </Text>
      <Text color="$textMuted" fontSize={13} textAlign="center" maxWidth={280} lineHeight={19}>
        {t('friends.searchPrompt.subtitle')}
      </Text>
    </YStack>
  );
}
