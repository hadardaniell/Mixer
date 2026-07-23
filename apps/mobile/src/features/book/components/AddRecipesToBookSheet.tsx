import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useRecipeCategoryTag } from '@/features/categories/hooks/useCategories';
import { ManualTextInput } from '@/features/recipe/components/manual/ManualTextInput';
import { RecipeCard } from '@/shared/ui/RecipeCard';
import { Sheet } from '@/shared/ui/Sheet';

import { useMyRecipesAll } from '../hooks/useMyRecipesAll';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Recipe ids already in the book — filtered out of the picker. */
  existingRecipeIds: string[];
  busy: boolean;
  onConfirm: (recipeIds: string[]) => void;
}

/**
 * Multi-select picker for adding my recipes to a book. Mirrors the create-book
 * wizard's step 2, minus the recipes the book already holds.
 */
export function AddRecipesToBookSheet({
  open,
  onOpenChange,
  existingRecipeIds,
  busy,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const tagOf = useRecipeCategoryTag();
  const { data: recipes = [], isLoading } = useMyRecipesAll();

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const existing = useMemo(() => new Set(existingRecipeIds), [existingRecipeIds]);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes
      .filter((r) => !existing.has(r.id))
      .filter((r) => !q || r.title.toLowerCase().includes(q));
  }, [recipes, existing, query]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const close = () => {
    setSelected(new Set());
    setQuery('');
    onOpenChange(false);
  };

  const confirm = () => {
    if (selected.size === 0 || busy) return;
    onConfirm([...selected]);
    setSelected(new Set());
    setQuery('');
  };

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())} snapPoints={[85]}>
      <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
        {t('book.addRecipesSheet.title')}
      </Text>

      <ManualTextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('book.addRecipesSheet.searchPlaceholder')}
      />

      {isLoading ? (
        <YStack paddingVertical="$6" alignItems="center">
          <ActivityIndicator color={theme.primary?.val as string} />
        </YStack>
      ) : candidates.length === 0 ? (
        <Text color="$textMuted" fontSize={14} textAlign="center" paddingVertical="$5">
          {recipes.length === 0
            ? t('book.addRecipesSheet.noRecipes')
            : t('book.addRecipesSheet.allAdded')}
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <XStack flexWrap="wrap" gap="$3" justifyContent="space-between" paddingBottom="$3">
            {candidates.map((r) => (
              <YStack key={r.id} width="47%" marginBottom="$3">
                <RecipeCard
                  width="100%"
                  selectable
                  selected={selected.has(r.id)}
                  onPress={() => toggle(r.id)}
                  isFavorited={false}
                  onToggleFavorite={() => {}}
                  recipe={{
                    id: r.id,
                    name: r.title,
                    imageUrl: r.coverImageUrl,
                    tag: tagOf(r),
                  }}
                />
              </YStack>
            ))}
          </XStack>
        </ScrollView>
      )}

      <YStack
        onPress={confirm}
        disabled={selected.size === 0 || busy}
        height={54}
        borderRadius={20}
        backgroundColor="$primary"
        alignItems="center"
        justifyContent="center"
        opacity={selected.size === 0 || busy ? 0.55 : 1}
        pressStyle={{ backgroundColor: '$buttonPrimaryBgHover' }}
      >
        <Text color="$textOnPrimary" fontSize={16} fontWeight="700">
          {busy
            ? t('book.addRecipesSheet.adding')
            : t('book.addRecipesSheet.confirm', { count: selected.size })}
        </Text>
      </YStack>
    </Sheet>
  );
}
