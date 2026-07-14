import type { ExtractFromTextResult, Recipe } from '@mixer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import type { RecipeSourceTypeSchema } from '@mixer/contracts';

import { feedApi } from '@/features/home/api/feedApi';
import { mapExtraction } from '@/features/recipe/lib/mapExtraction';
import { useLanguage } from '@/features/settings/hooks/useLanguage';

type SourceType = z.infer<typeof RecipeSourceTypeSchema>;

interface CreateArgs {
  /** Runs the AI extraction (text or image) and returns the partial recipe. */
  extract: () => Promise<ExtractFromTextResult>;
  sourceType: SourceType;
  sourceUrl?: string;
}

/**
 * extract → map → create-as-draft, in one mutation. The caller awaits the
 * returned Recipe and navigates to it; this hook owns loading/error state and
 * refreshes the drafts list on success.
 */
export function useCreateFromExtraction() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const qc = useQueryClient();

  return useMutation<Recipe, Error, CreateArgs>({
    mutationFn: async ({ extract, sourceType, sourceUrl }) => {
      const result = await extract();
      const input = mapExtraction(result, language, sourceType, t('newRecipe.title'), sourceUrl);
      return feedApi.createRecipe(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
}
