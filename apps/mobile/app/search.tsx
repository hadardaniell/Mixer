import { useTranslation } from 'react-i18next';
import { H2, YStack } from 'tamagui';

export default function SearchScreen() {
  const { t } = useTranslation();
  return (
    <YStack flex={1} padding="$4" gap="$3">
      <H2>{t('common.search')}</H2>
    </YStack>
  );
}
