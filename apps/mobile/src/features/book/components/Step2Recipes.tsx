import type { Recipe } from '@mixer/contracts';
import { Check, ChefHat, UtensilsCrossed } from 'lucide-react-native';
import { type Dispatch, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { ManualTextInput } from '@/features/recipe/components/manual/ManualTextInput';
import { useIsRtl } from '@/shared/lib/useIsRtl';

import { useMyRecipesAll } from '../hooks/useMyRecipesAll';
import type { BookForm, BookFormAction } from '../lib/bookForm';
import { BookStepShell } from './BookStepShell';

interface Props {
  form: BookForm;
  dispatch: Dispatch<BookFormAction>;
}

/** Step 2 — search + multi-select grid of my recipes, with select-all/clear. */
export function Step2Recipes({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const muted = theme.textMuted?.val as string;
  const { data: recipes = [], isLoading } = useMyRecipesAll();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? recipes.filter((r) => r.title.toLowerCase().includes(q)) : recipes;
  }, [recipes, query]);

  const selected = new Set(form.recipeIds);
  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) {
      const filteredIds = new Set(filtered.map((r) => r.id));
      dispatch({ type: 'setRecipes', ids: form.recipeIds.filter((id) => !filteredIds.has(id)) });
    } else {
      const merged = new Set([...form.recipeIds, ...filtered.map((r) => r.id)]);
      dispatch({ type: 'setRecipes', ids: [...merged] });
    }
  };

  return (
    <BookStepShell
      Icon={UtensilsCrossed}
      iconBg="$accentMint"
      title={t('createBook.step2.title')}
      subtitle={t('createBook.step2.subtitle')}
    >
      <YStack gap="$3" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
        <ManualTextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('createBook.step2.searchPlaceholder')}
        />

        <XStack alignItems="center" justifyContent="space-between">
          <Text color="$textMuted" fontSize={13}>
            {t('createBook.step2.selectedCount', { count: form.recipeIds.length })}
          </Text>
          {filtered.length > 0 ? (
            <Text
              onPress={toggleAll}
              color="$primary"
              fontSize={14}
              fontWeight="700"
              pressStyle={{ opacity: 0.7 }}
            >
              {allSelected ? t('createBook.step2.clearAll') : t('createBook.step2.selectAll')}
            </Text>
          ) : null}
        </XStack>

        {isLoading ? (
          <Text color="$textMuted" fontSize={13} textAlign="center" paddingVertical="$3">
            {t('createBook.loading')}
          </Text>
        ) : filtered.length === 0 ? (
          <Text color="$textMuted" fontSize={13} textAlign="center" paddingVertical="$3">
            {t('createBook.step2.empty')}
          </Text>
        ) : (
          <XStack flexWrap="wrap" gap="$3">
            {filtered.map((recipe) => (
              <RecipeTile
                key={recipe.id}
                recipe={recipe}
                selected={selected.has(recipe.id)}
                onPress={() => dispatch({ type: 'toggleRecipe', id: recipe.id })}
                mutedColor={muted}
                checkColor={theme.textOnPrimary?.val as string}
              />
            ))}
          </XStack>
        )}
      </YStack>
    </BookStepShell>
  );
}

function RecipeTile({
  recipe,
  selected,
  onPress,
  mutedColor,
  checkColor,
}: {
  recipe: Recipe;
  selected: boolean;
  onPress: () => void;
  mutedColor: string;
  checkColor: string;
}) {
  return (
    <YStack
      width="47%"
      onPress={onPress}
      borderRadius={16}
      borderWidth={2}
      borderColor={selected ? '$primary' : '$border'}
      backgroundColor="$surface"
      overflow="hidden"
      pressStyle={{ opacity: 0.9 }}
    >
      <YStack height={96} backgroundColor="$accentLavender" alignItems="center" justifyContent="center">
        {recipe.coverImageUrl ? (
          <Image source={{ uri: recipe.coverImageUrl }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <ChefHat size={30} color={mutedColor} />
        )}
        {selected ? (
          <YStack
            position="absolute"
            top={6}
            end={6}
            width={24}
            height={24}
            borderRadius={999}
            backgroundColor="$primary"
            alignItems="center"
            justifyContent="center"
          >
            <Check size={15} color={checkColor} strokeWidth={3} />
          </YStack>
        ) : null}
      </YStack>
      <Text color="$text" fontSize={13} fontWeight="600" numberOfLines={1} padding={8}>
        {recipe.title}
      </Text>
    </YStack>
  );
}
