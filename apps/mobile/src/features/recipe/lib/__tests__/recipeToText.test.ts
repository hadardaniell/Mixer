import { describe, expect, it } from 'vitest';
import type { Recipe } from '@mixer/contracts';
import { recipeToText } from '../recipeToText';

describe('recipeToText', () => {
  const sampleRecipe: Recipe = {
    id: '507f1f77bcf86cd799439011',
    ownerId: '507f1f77bcf86cd799439022',
    title: 'עוגת שוקולד',
    description: 'עוגה קלה וטעימה',
    ingredients: [
      { name: 'קמח', amount: 2, unit: 'כוס' },
      { name: 'סוכר', amount: 1, unit: 'כוס' },
      { name: 'מלח', amount: undefined, unit: 'קורט' },
    ],
    steps: [
      { order: 1, text: 'ערבב את הרכיבים היבשים' },
      { order: 2, text: 'אפה ב-180 מעלות במשך 30 דקות' },
    ],
    status: 'published',
    tags: [],
    categoryIds: [],
    language: 'he',
    source: { type: 'manual' },
    visibility: 'public',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const mockT = ((key: string) => {
    if (key === 'recipe.ingredients') return 'מצרכים:';
    if (key === 'recipe.preparation') return 'אופן ההכנה:';
    return key;
  }) as any;

  it('converts a recipe to formatted text with multiplier=1', () => {
    const text = recipeToText(sampleRecipe, mockT, 1);
    expect(text).toContain('עוגת שוקולד');
    expect(text).toContain('עוגה קלה וטעימה');
    expect(text).toContain('מצרכים:');
    expect(text).toContain('• 2 כוס קמח');
    expect(text).toContain('• 1 כוס סוכר');
    expect(text).toContain('• קורט מלח');
    expect(text).toContain('אופן ההכנה:');
    expect(text).toContain('1. ערבב את הרכיבים היבשים');
    expect(text).toContain('2. אפה ב-180 מעלות במשך 30 דקות');
    expect(text).toContain('Mixer');
  });

  it('scales ingredients when multiplier is doubled (x2)', () => {
    const text = recipeToText(sampleRecipe, mockT, 2);
    expect(text).toContain('• 4 כוס קמח');
    expect(text).toContain('• 2 כוס סוכר');
  });
});
