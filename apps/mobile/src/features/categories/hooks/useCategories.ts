import type { Category, Recipe } from '@mixer/contracts';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { categoriesApi } from '@/features/categories/api/categoriesApi';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import type { Language } from '@/shared/lib/i18n';

// Categories are reference data — refetch rarely.
const ONE_HOUR = 1000 * 60 * 60;

export function categoryLabel(c: Category, language: Language): string {
  return c.label[language] ?? c.label.en;
}

export function useCategories() {
  const q = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
    staleTime: ONE_HOUR,
  });
  const categories = q.data?.items ?? [];
  const byId = useMemo(
    () => new Map(categories.map((c) => [c.id, c] as const)),
    [categories],
  );
  return { categories, byId, isLoading: q.isLoading };
}

/**
 * Resolves a recipe's category references to a localized, " · "-joined label for
 * the card subtitle. Falls back to the recipe's first free-text tag when it has
 * no categories yet (legacy recipes).
 */
export function useRecipeCategoryTag() {
  const { byId } = useCategories();
  const { language } = useLanguage();
  return useCallback(
    (r: Pick<Recipe, 'categoryIds' | 'tags'>): string | undefined => {
      const labels = r.categoryIds
        .map((id) => byId.get(id))
        .filter((c): c is Category => !!c)
        .map((c) => categoryLabel(c, language));
      return labels.length > 0 ? labels.join(' · ') : r.tags[0];
    },
    [byId, language],
  );
}
