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
 *
 * In edit mode an existing recipe id is passed in, so every step PATCHes it
 * from the first save instead of creating a new draft.
 */
export function useManualRecipeDraft(initialDraftId: string | null = null) {
  const { language } = useLanguage();
  const qc = useQueryClient();
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
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
          // Keep the recipe-detail cache fresh so re-opening this draft in edit
          // mode seeds the just-saved values, not a stale snapshot.
          qc.setQueryData(['recipe', created.id], created);
          invalidate();
          return created;
        }
        const updated = await feedApi.updateRecipe(draftId, patch);
        qc.setQueryData(['recipe', draftId], updated);
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
      qc.setQueryData(['recipe', draftId], published);
      invalidate();
      return published;
    } finally {
      setIsSaving(false);
    }
  }, [draftId, invalidate]);

  return { draftId, isSaving, saveStep, publish };
}
