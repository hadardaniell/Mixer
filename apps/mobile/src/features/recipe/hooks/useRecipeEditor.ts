import type { Recipe } from '@mixer/contracts';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useReducer, useState } from 'react';

import { feedApi } from '@/features/home/api/feedApi';

import {
  initialManualForm,
  manualFormReducer,
  manualFormToInput,
  recipeToManualForm,
} from '../lib/manualRecipe';
import { useUploadRecipeImage } from './useUploadRecipeImage';

function resolveMime(uri: string, assetMime?: string): string {
  if (assetMime) return assetMime;
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function fileNameFor(uri: string, type: string): string {
  const fromUri = uri.split('/').pop()?.split('?')[0];
  if (fromUri && fromUri.includes('.')) return fromUri;
  const ext = type.split('/')[1] ?? 'jpg';
  return `cover.${ext}`;
}

/**
 * Owns the inline edit-mode lifecycle for the recipe detail screen: seeds a
 * form from the recipe, lets the same page render its fields as inputs, picks a
 * replacement cover, and PATCHes the whole recipe on save. The detail page
 * looks identical in both modes — this hook just swaps text for values.
 *
 * Editing is gated by the caller (owner only); the hook itself is agnostic.
 */
export function useRecipeEditor(recipe: Recipe | undefined) {
  const qc = useQueryClient();
  const upload = useUploadRecipeImage();
  const [editing, setEditing] = useState(false);
  const [form, dispatch] = useReducer(manualFormReducer, initialManualForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);

  const start = () => {
    if (!recipe) return;
    dispatch({ type: 'reset', value: recipeToManualForm(recipe) });
    setError(false);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(false);
  };

  /** Pick a new cover photo, upload it, and point the form at its public URL. */
  const pickImage = async () => {
    if (upload.isPending) return;
    setError(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (!asset?.uri) return;
    const type = resolveMime(asset.uri, asset.mimeType);
    try {
      const imageUrl = await upload.mutateAsync({
        uri: asset.uri,
        name: asset.fileName ?? fileNameFor(asset.uri, type),
        type,
      });
      dispatch({ type: 'patch', value: { coverImageUrl: imageUrl } });
    } catch {
      setError(true);
    }
  };

  /** PATCH the recipe with the edited form. Resolves true on success. */
  const save = async (): Promise<boolean> => {
    if (!recipe || isSaving || !form.title.trim()) return false;
    setIsSaving(true);
    setError(false);
    try {
      const updated = await feedApi.updateRecipe(recipe.id, manualFormToInput(form));
      qc.setQueryData(['recipe', recipe.id], updated);
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['drafts'] });
      setEditing(false);
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    editing,
    form,
    dispatch,
    start,
    cancel,
    pickImage,
    save,
    isSaving,
    imageUploading: upload.isPending,
    error,
    canSave: form.title.trim().length > 0,
  };
}
