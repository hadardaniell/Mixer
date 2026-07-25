import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Text } from 'tamagui';

import { feedApi } from '@/features/home/api/feedApi';

interface RecipeCreatorCreditProps {
  /** The recipe's owner id — resolved to a display name for the credit line. */
  ownerId: string;
}

/**
 * A small, quiet "created by …" credit pinned at the very bottom of the recipe,
 * copyright-style. Resolves the owner's display name on its own; renders nothing
 * until it's available (so no flash of a half-line).
 */
export function RecipeCreatorCredit({ ownerId }: RecipeCreatorCreditProps) {
  const { t } = useTranslation();

  const { data } = useQuery({
    queryKey: ['profile', 'user', ownerId],
    queryFn: () => feedApi.usersByIds([ownerId]),
    enabled: !!ownerId,
    staleTime: 5 * 60 * 1000,
  });

  const name = data?.items[0]?.displayName;
  if (!name) return null;

  return (
    <Text
      fontSize={11}
      color="$textSubtle"
      textAlign="center"
      paddingTop="$2"
      paddingBottom="$1"
    >
      {t('recipe.createdBy', { name })}
    </Text>
  );
}
