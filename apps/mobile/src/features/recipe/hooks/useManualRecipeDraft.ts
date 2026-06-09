import type { CreateRecipeInput, Recipe } from '@mixer/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { feedApi } from '@/features/home/api/feedApi';
import { useLanguage } from '@/features/settings/hooks/useLanguage';

/**
 * Owns the lifecycle of the manually-created recipe: the first saved step POSTs
 * a `status:'draft'` recipe (so it shows up in the drafts row and survives the
 * user leaving), each later step PATCHes that draft, and `publish` flips it to
 * `status:'published'` on the final step. Returns the draft id once it exists.
 */
export function useManualRecipeDraft() {
  const { language } = useLanguage();
  const qc = useQueryClient();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['drafts'] });
  }, [qc]);

  /** Create-on-first-call, then patch. Returns the up-to-date recipe. */
  const saveStep = useCallback(
    async (patch: Partial<CreateRecipeInput>): Promise<Recipe> => {
      setIsSaving(true);
      try {
        if (!draftId) {
          const input: CreateRecipeInput = {
            title: '',
            ingredients: [],
            steps: [],
            tags: [],
            ...patch,
            language,
            source: { type: 'manual' },
            visibility: 'private',
            status: 'draft',
          };
          const created = await feedApi.createRecipe(input);
          setDraftId(created.id);
          invalidate();
          return created;
        }
        const updated = await feedApi.updateRecipe(draftId, patch);
        invalidate();
        return updated;
      } finally {
        setIsSaving(false);
      }
    },
    [draftId, language, invalidate],
  );

  /** Flip the draft to published. Throws if no draft exists yet. */
  const publish = useCallback(async (): Promise<Recipe> => {
    if (!draftId) throw new Error('No draft to publish');
    setIsSaving(true);
    try {
      const published = await feedApi.updateRecipe(draftId, { status: 'published' });
      invalidate();
      return published;
    } finally {
      setIsSaving(false);
    }
  }, [draftId, invalidate]);

  return { draftId, isSaving, saveStep, publish };
}
