import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToggleRecipeFavorite } from '@/features/home/hooks/useFavoriteMutations';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { ShareSheet } from '@/features/shares/components/ShareSheet';
import { isRTL } from '@/shared/lib/i18n';

import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { PrimaryButton } from '@/shared/ui/PrimaryButton';

import { IngredientsEditor } from '../components/IngredientsEditor';
import { IngredientsList } from '../components/IngredientsList';
import { PreparationSteps } from '../components/PreparationSteps';
import { RecipeActionBar } from '../components/RecipeActionBar';
import { RecipeCreatorCredit } from '../components/RecipeCreatorCredit';
import { RecipeMetaEditor } from '../components/RecipeMetaEditor';
import { SaveToBookSheet } from '../components/SaveToBookSheet';
import { RecipeHeader } from '../components/RecipeHeader';
import { RecipeSkeleton } from '../components/RecipeSkeleton';
import { RecipeSourceNote } from '../components/RecipeSourceNote';
import { RecipeTip } from '../components/RecipeTip';
import { StartCookingButton } from '../components/StartCookingButton';
import { StepsEditor } from '../components/StepsEditor';
import { recipeToText } from '../lib/recipeToText';
import { useDeleteRecipe } from '../hooks/useDeleteRecipe';
import { useRecipe } from '../hooks/useRecipe';
import { useRecipeEditor } from '../hooks/useRecipeEditor';
import { useSaveAsRecipe } from '../hooks/useSaveAsRecipe';

interface RecipeScreenProps {
  recipeId: string;
}

export function RecipeScreen({ recipeId }: RecipeScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRtl = isRTL(language);

  const { user } = useAuth();
  const { data: recipe, isLoading, isError } = useRecipe(recipeId);
  const toggleFavorite = useToggleRecipeFavorite();
  const editor = useRecipeEditor(recipe);
  const deleteRecipe = useDeleteRecipe();
  const saveAs = useSaveAsRecipe();

  // Quantity multiplier — the recipe's authored amounts are "כמות 1" (×1).
  const [multiplier, setMultiplier] = useState(1);
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const [copied, setCopied] = useState(false);
  const [bookSheetOpen, setBookSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState<'draft' | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tipNotes = useMemo(
    () => (recipe?.ingredients ?? []).map((i) => i.note).filter((n): n is string => !!n),
    [recipe],
  );

  if (isLoading) {
    return (
      <YStack
        flex={1}
        backgroundColor="$bg"
        paddingTop={insets.top + 8}
        style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
      >
        <RecipeSkeleton />
      </YStack>
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

  // Only the owner sees "share" (the server refuses to share someone else's
  // recipe); everyone else gets "save a copy" in that slot instead. Owners still
  // can't share an unpublished draft, so that one reason stays surfaced.
  const isOwner = recipe.ownerId === user?.id;
  const canShare = isOwner && recipe.status !== 'draft';
  const { editing, form, dispatch } = editor;

  const handleShare = () => {
    if (canShare) {
      setShareSheetOpen(true);
      return;
    }
    // Owner + draft — the only remaining block worth explaining.
    setShareNotice('draft');
    if (shareNoticeTimer.current) clearTimeout(shareNoticeTimer.current);
    shareNoticeTimer.current = setTimeout(() => setShareNotice(null), 3000);
  };

  const handleSaveAs = () =>
    saveAs.mutate(recipe.id, {
      onSuccess: (created) => router.replace(`/recipes/${created.id}` as never),
    });

  // Copies the recipe as plain text so it can be pasted straight into WhatsApp.
  // Scaled by the current multiplier — you copy what you see.
  const handleCopy = async () => {
    await Clipboard.setStringAsync(recipeToText(recipe, t, multiplier));
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = () =>
    deleteRecipe.mutate(recipe.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        router.canGoBack() ? router.back() : router.replace('/home');
      },
    });

  return (
    <>
      <ScrollView
      style={{ backgroundColor: theme.bg?.val as string, width: "100%" }}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 24,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          canEdit={isOwner}
          editing={editing}
          onStartEdit={editor.start}
          onCancelEdit={editor.cancel}
          editTitle={form.title}
          editDescription={form.description}
          editCoverImageUrl={form.coverImageUrl}
          onChangeTitle={(title) => dispatch({ type: 'patch', value: { title } })}
          onChangeDescription={(description) =>
            dispatch({ type: 'patch', value: { description } })
          }
          onPickImage={editor.pickImage}
          imageUploading={editor.imageUploading}
        />

        {/* <StartCookingButton label={t('recipe.startCooking')} onPress={() => {}} /> */}

        {editing ? (
          <RecipeMetaEditor form={form} dispatch={dispatch} />
        ) : (
          <YStack gap="$1">
            <RecipeActionBar
              isOwner={isOwner}
              onShare={handleShare}
              onSaveAs={handleSaveAs}
              savingAs={saveAs.isPending}
              onSaveToBook={() => setBookSheetOpen(true)}
              onCopy={handleCopy}
              copied={copied}
            />
            {shareNotice ? (
              <Text fontSize={13} fontWeight="600" color="$danger" textAlign="center">
                {t(`share.blocked.${shareNotice}`)}
              </Text>
            ) : null}
          </YStack>
        )}

        {editing ? (
          <IngredientsEditor form={form} dispatch={dispatch} />
        ) : (
          <IngredientsList
            ingredients={recipe.ingredients}
            multiplier={multiplier}
            onMultiplierChange={setMultiplier}
            checked={checked}
            onToggle={toggleChecked}
          />
        )}

        {editing ? (
          <StepsEditor form={form} dispatch={dispatch} />
        ) : (
          <PreparationSteps steps={recipe.steps} />
        )}

        {editing ? (
          <YStack gap="$2">
            {editor.error ? (
              <Text fontSize={13} fontWeight="600" color="$danger" textAlign="center">
                {t('recipe.edit.saveError')}
              </Text>
            ) : null}
            <PrimaryButton
              label={editor.isSaving ? t('recipe.edit.saving') : t('recipe.edit.save')}
              onPress={editor.save}
              loading={editor.isSaving}
              disabled={!editor.canSave}
            />
            <Text
              onPress={editor.cancel}
              fontSize={15}
              fontWeight="600"
              color="$textMuted"
              textAlign="center"
              paddingVertical="$2"
              pressStyle={{ opacity: 0.6 }}
            >
              {t('recipe.edit.cancel')}
            </Text>

            {/* Destructive, owner-only. Kept apart from save/cancel with extra
                space so it isn't hit by accident. */}
            <Text
              onPress={deleteRecipe.isPending ? undefined : () => setDeleteOpen(true)}
              fontSize={15}
              fontWeight="700"
              color="$danger"
              textAlign="center"
              paddingVertical="$2"
              marginTop="$3"
              opacity={deleteRecipe.isPending ? 0.5 : 1}
              pressStyle={{ opacity: 0.6 }}
            >
              {deleteRecipe.isPending ? t('recipe.delete.deleting') : t('recipe.delete.action')}
            </Text>
          </YStack>
        ) : (
          <YStack>
            <RecipeSourceNote recipe={recipe} />
            {/* A fork already shows "created from another recipe"; the owner is
                then just whoever saved the copy, so the credit would be
                misleading — skip it. */}
            {recipe.forkedFrom ? null : <RecipeCreatorCredit ownerId={recipe.ownerId} />}
          </YStack>
        )}
      </YStack>
      </ScrollView>

      <SaveToBookSheet
        open={bookSheetOpen}
        onOpenChange={setBookSheetOpen}
        recipeId={recipe.id}
      />

      <ShareSheet
        open={shareSheetOpen}
        onOpenChange={setShareSheetOpen}
        resourceType="recipe"
        resourceId={recipe.id}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('recipe.delete.title')}
        message={t('recipe.delete.message')}
        confirmLabel={t('recipe.delete.confirm')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={deleteRecipe.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
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
