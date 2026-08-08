import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';

import { ManualTextInput } from '@/features/recipe/components/manual/ManualTextInput';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
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
  const [pendingRemove, setPendingRemove] = useState<Card | null>(null);

  const confirmRemove = (card: Card) => {
    if (!canEdit) return;
    setPendingRemove(card);
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
        // Centred in the space the grid would have filled, so the line reads as a
        // state rather than as a caption that lost its content.
        <YStack minHeight={200} alignItems="center" justifyContent="center" paddingHorizontal="$4">
          <Text color="$textMuted" fontSize={13} textAlign="center">
            {totalCount === 0 ? t('book.empty') : t('book.noSearchResults', { query })}
          </Text>
        </YStack>
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
                onRemove={canEdit ? () => confirmRemove(r) : undefined}
              />
            </YStack>
          ))}
        </XStack>
      )}

      <ConfirmDialog
        open={pendingRemove !== null}
        title={t('book.removeRecipeTitle')}
        message={t('book.removeRecipeMessage', { name: pendingRemove?.name ?? '' })}
        confirmLabel={t('book.removeRecipeConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          if (pendingRemove) onRemoveRecipe(pendingRemove);
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </YStack>
  );
}
