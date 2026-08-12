// apps/mobile/src/features/recipe/hooks/useTranslateRecipe.ts
import type { Recipe } from '@mixer/contracts';
import { useMutation } from '@tanstack/react-query';
import { feedApi } from '@/features/home/api/feedApi';

export function useTranslateRecipe() {
  return useMutation<Recipe, Error, string>({
    mutationFn: (recipeId: string) => feedApi.translateRecipe(recipeId),
  });
}