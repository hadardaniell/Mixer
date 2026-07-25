import { useMutation, useQueryClient } from '@tanstack/react-query';

import { feedApi } from '@/features/home/api/feedApi';
import { removeRecentlyViewed } from '@/features/home/storage/recentlyViewed';

/** Deletes a recipe (a draft or a published recipe) and refreshes the drafts
 *  row + every feed/profile list, drops its detail cache, and removes it from
 *  the recently-viewed ring (so the home row doesn't 404 on a dead id). */
export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => feedApi.deleteRecipe(id),
    onSuccess: (_data, id) => {
      removeRecentlyViewed(id);
      qc.removeQueries({ queryKey: ['recipe', id] });
      qc.invalidateQueries({ queryKey: ['drafts'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
