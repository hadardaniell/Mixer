import type { Recipe } from '@mixer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { feedApi } from '@/features/home/api/feedApi';

/**
 * "Save as" — duplicates a recipe you don't own into a private copy you do
 * (the server adds it to your personal book). Refreshes the feed/profile lists
 * so the new copy shows up under "my recipes".
 */
export function useSaveAsRecipe() {
  const qc = useQueryClient();
  return useMutation<Recipe, Error, string>({
    mutationFn: (id) => feedApi.saveAsRecipe(id),
    onSuccess: (created) => {
      qc.setQueryData(['recipe', created.id], created);
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
