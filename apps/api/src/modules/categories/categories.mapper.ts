// apps/api/src/modules/categories/categories.mapper.ts
import type { Category } from '@mixer/contracts';
import type { CategoryDoc } from '../../db/types.js';

export function toCategory(doc: CategoryDoc): Category {
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    label: doc.label,
    accent: doc.accent,
    order: doc.order,
    isActive: doc.isActive,
  };
}
