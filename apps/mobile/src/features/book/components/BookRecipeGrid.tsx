import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { ManualTextInput } from '@/features/recipe/components/manual/ManualTextInput';
import { RecipeCard, type RecipeCardData } from '@/shared/ui/RecipeCard';

type Card = RecipeCardData & { isFavorite: boolean };

interface Props {
  recipes: Card[];
  query: string;
  onQueryChange: (q: string) => void;
  /** Total recipes in the book, before the search filter — drives which empty state shows. */
  totalCount: number;
  canEdit: boolean;
  isLoading: boolean;
  onOpenRecipe: (id: string) => void;
  onToggleFavorite: (card: Card) => void;
  onAddRecipes: () => void;
  onRemoveRecipe: (card: Card) => void;
}

/**
 * The book's recipes as a two-column grid, with a local search field and — for
 * owners and editors — an add button. Long-pressing a card offers to remove it
 * from the book (which never deletes the recipe itself).
 */
export function BookRecipeGrid({
  recipes,
  query,
  onQueryChange,
  totalCount,
  canEdit,
  isLoading,
  onOpenRecipe,
  onToggleFavorite,
  onAddRecipes,
  onRemoveRecipe,
}: Props) {
  const { t } = useTranslation();

  const confirmRemove = (card: Card) => {
    if (!canEdit) return;
    Alert.alert(t('book.removeRecipeTitle'), t('book.removeRecipeMessage', { name: card.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('book.removeRecipeConfirm'),
        style: 'destructive',
        onPress: () => onRemoveRecipe(card),
      },
    ]);
  };

  return (
    <YStack paddingHorizontal={20} paddingTop={18} gap={16}>
      <XStack alignItems="center" gap="$3">
        <YStack flex={1}>
          <ManualTextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder={t('book.searchPlaceholder')}
          />
        </YStack>
        {canEdit ? (
          <YStack
            onPress={onAddRecipes}
            width={50}
            height={50}
            borderRadius={999}
            backgroundColor="$text"
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.85 }}
          >
            {/* White plus on the ink disc — it was `$text` on `$buttonSecondaryBg`,
                i.e. ink on ink, so the plus was invisible. */}
            <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
          </YStack>
        ) : null}
      </XStack>

      {isLoading ? (
        <Text color="$textMuted" fontSize={13} textAlign="center" paddingVertical="$4">
          {t('book.loading')}
        </Text>
      ) : recipes.length === 0 ? (
        <Text color="$textMuted" fontSize={13} textAlign="center" paddingVertical="$6">
          {totalCount === 0 ? t('book.empty') : t('book.noSearchResults', { query })}
        </Text>
      ) : (
        <XStack flexWrap="wrap" gap="$3" justifyContent="space-between">
          {recipes.map((r) => (
            <YStack key={r.id} width="47%" marginBottom="$3">
              <RecipeCard
                width="100%"
                recipe={r}
                isFavorited={r.isFavorite}
                onToggleFavorite={() => onToggleFavorite(r)}
                onPress={() => onOpenRecipe(r.id)}
                onLongPress={canEdit ? () => confirmRemove(r) : undefined}
              />
            </YStack>
          ))}
        </XStack>
      )}
    </YStack>
  );
}
