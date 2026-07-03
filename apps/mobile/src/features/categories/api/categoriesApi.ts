import type { Category } from '@mixer/contracts';

import { http } from '@/shared/lib/httpClient';

interface ListResponse<T> {
  items: T[];
  total?: number;
}

export const categoriesApi = {
  list: () => http<ListResponse<Category>>('/categories'),
};
