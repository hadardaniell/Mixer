import { useMutation, useQueryClient } from '@tanstack/react-query';

import { feedApi } from '@/features/home/api/feedApi';

/** Deletes a recipe (e.g. a draft) and refreshes the drafts row + feeds. */
export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => feedApi.deleteRecipe(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
