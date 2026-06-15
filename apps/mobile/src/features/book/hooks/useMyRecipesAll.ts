import { useQuery } from '@tanstack/react-query';

import { feedApi } from '@/features/home/api/feedApi';

/** All of the current user's recipes (for the book recipe-picker). */
export function useMyRecipesAll() {
  return useQuery({
    queryKey: ['myRecipes', 'all'],
    queryFn: () => feedApi.allMyRecipes(),
    select: (res) => res.items,
  });
}
