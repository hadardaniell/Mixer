import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, YStack } from 'tamagui';

import { useToggleRecipeFavorite } from '@/features/home/hooks/useFavoriteMutations';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { addToShoppingList } from '@/features/shopping-list/storage/shoppingList';
import { isRTL } from '@/shared/lib/i18n';

import { IngredientsList } from '../components/IngredientsList';
import { PreparationSteps } from '../components/PreparationSteps';
import { RecipeActionBar } from '../components/RecipeActionBar';
import { RecipeHeader } from '../components/RecipeHeader';
import { RecipeSourceNote } from '../components/RecipeSourceNote';
import { RecipeTip } from '../components/RecipeTip';
import { StartCookingButton } from '../components/StartCookingButton';
import { useRecipe } from '../hooks/useRecipe';

interface RecipeScreenProps {
  recipeId: string;
}

export function RecipeScreen({ recipeId }: RecipeScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRtl = isRTL(language);

  const { data: recipe, isLoading, isError } = useRecipe(recipeId);
  const toggleFavorite = useToggleRecipeFavorite();

  // Quantity multiplier — the recipe's authored amounts are "כמות 1" (×1).
  const [multiplier, setMultiplier] = useState(1);
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const [addedNotice, setAddedNotice] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tipNotes = useMemo(
    () => (recipe?.ingredients ?? []).map((i) => i.note).filter((n): n is string => !!n),
    [recipe],
  );

  if (isLoading) {
    return (
      <Centered>
        <ActivityIndicator color={theme.primary?.val as string} />
      </Centered>
    );
  }

  if (isError || !recipe) {
    return (
      <Centered>
        <Text color="$textMuted" fontSize={15} textAlign="center">
          {t('recipe.loadError')}
        </Text>
      </Centered>
    );
  }

  const isFavorited = recipe.isFavorite ?? false;

  const toggleChecked = (index: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const handleAddToShoppingList = () => {
    addToShoppingList(
      recipe.ingredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount != null ? ing.amount * multiplier : undefined,
        unit: ing.unit,
        recipeId: recipe.id,
        recipeName: recipe.title,
      })),
    );
    setAddedNotice(true);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg?.val as string, width: "100%" }}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      <YStack
        width="100%"
        paddingHorizontal="$4"
        gap="$4"
        style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
      >
        <RecipeHeader
          recipe={recipe}
          isFavorited={isFavorited}
          onToggleFavorite={() => toggleFavorite.mutate({ id: recipe.id, next: !isFavorited })}
          onShare={() => {}}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
        />

        <StartCookingButton label={t('recipe.startCooking')} onPress={() => {}} />

        <YStack gap="$1">
          <RecipeActionBar
            onShare={() => {}}
            onSaveToBook={() => {}}
            onShoppingList={handleAddToShoppingList}
          />
          {addedNotice ? (
            <Text fontSize={13} fontWeight="600" color="$success" textAlign="center">
              {t('recipe.addedToShoppingList')}
            </Text>
          ) : null}
        </YStack>

        <IngredientsList
          ingredients={recipe.ingredients}
          multiplier={multiplier}
          onMultiplierChange={setMultiplier}
          checked={checked}
          onToggle={toggleChecked}
        />

        <PreparationSteps steps={recipe.steps} />

        {/* {tipNotes.map((note, index) => (
          <RecipeTip key={index} text={note} />
        ))} */}

        <RecipeSourceNote recipe={recipe} />
      </YStack>
    </ScrollView>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <YStack
      flex={1}
      backgroundColor="$bg"
      alignItems="center"
      justifyContent="center"
      padding="$5"
      paddingTop={insets.top}
    >
      {children}
    </YStack>
  );
}
