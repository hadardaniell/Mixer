import { describe, expect, it } from 'vitest';
import type { ExtractFromTextResult } from '@mixer/contracts';
import { mapExtraction } from '../mapExtraction';

describe('mapExtraction', () => {
  it('maps AI extraction payload into a published CreateRecipeInput', () => {
    const rawResult: ExtractFromTextResult = {
      title: 'פנקייק אוורירי',
      description: 'מתכון מהיר לפנקייקים',
      ingredients: [{ name: 'קמח', amount: 1, unit: 'כוס' }],
      steps: [{ order: 1, text: 'ערבב בקערה' }],
      servings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      difficulty: 'easy',
      tags: ['מתוק', 'ארוחת בוקר'],
      coverImageUrl: 'https://images.pexels.com/photos/123/pexels-photo-123.jpeg',
    };

    const mapped = mapExtraction(rawResult, 'he', 'manual', 'מתכון ללא שם');

    expect(mapped.title).toBe('פנקייק אוורירי');
    expect(mapped.coverImageUrl).toBe('https://images.pexels.com/photos/123/pexels-photo-123.jpeg');
    expect(mapped.visibility).toBe('private');
    // An import arrives finished — only the manual wizard produces drafts.
    expect(mapped.status).toBe('published');
    expect(mapped.language).toBe('he');
    expect(mapped.source.type).toBe('manual');
    expect(mapped.ingredients).toHaveLength(1);
    expect(mapped.steps).toHaveLength(1);
  });

  it('uses fallback title when title is empty or missing', () => {
    const rawResult: ExtractFromTextResult = {
      title: '  ',
    };

    const mapped = mapExtraction(rawResult, 'he', 'image', 'מתכון מתמונה');
    expect(mapped.title).toBe('מתכון מתמונה');
    expect(mapped.source.type).toBe('image');
  });

  it('converts zero numeric fields to undefined so they pass schema validation', () => {
    const rawResult: ExtractFromTextResult = {
      title: 'מרק עוף',
      servings: 0,
      prepTimeMinutes: 0,
      cookTimeMinutes: 0,
      ingredients: [{ name: 'עוף', amount: 0, unit: 'יחידה' }],
      steps: [{ order: 1, text: 'לבשל', durationMinutes: 0 }],
    };

    const mapped = mapExtraction(rawResult, 'he', 'manual', 'מתכון ללא שם');

    // AI returns 0 when it doesn't know the value — 0 violates .positive() in the schema
    expect(mapped.servings).toBeUndefined();
    expect(mapped.prepTimeMinutes).toBeUndefined();
    expect(mapped.cookTimeMinutes).toBeUndefined();
    expect(mapped.ingredients[0]!.amount).toBeUndefined();
    expect(mapped.steps[0]!.durationMinutes).toBeUndefined();
  });

  it('preserves non-zero numeric fields unchanged', () => {
    const rawResult: ExtractFromTextResult = {
      title: 'פסטה',
      servings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      ingredients: [{ name: 'פסטה', amount: 200, unit: 'גרם' }],
      steps: [{ order: 1, text: 'לבשל', durationMinutes: 10 }],
    };

    const mapped = mapExtraction(rawResult, 'he', 'manual', 'מתכון ללא שם');

    expect(mapped.servings).toBe(4);
    expect(mapped.prepTimeMinutes).toBe(10);
    expect(mapped.cookTimeMinutes).toBe(20);
    expect(mapped.ingredients[0]!.amount).toBe(200);
    expect(mapped.steps[0]!.durationMinutes).toBe(10);
  });

  it('handles a mix of zero and non-zero values in the same recipe', () => {
    const rawResult: ExtractFromTextResult = {
      title: 'סלט',
      servings: 2,
      prepTimeMinutes: 0,
      cookTimeMinutes: 0,
      ingredients: [
        { name: 'עגבנייה', amount: 3, unit: 'יחידה' },
        { name: 'שמן', amount: 0, unit: 'כף' },
      ],
      steps: [
        { order: 1, text: 'לחתוך', durationMinutes: 5 },
        { order: 2, text: 'לערבב', durationMinutes: 0 },
      ],
    };

    const mapped = mapExtraction(rawResult, 'he', 'manual', 'מתכון ללא שם');

    expect(mapped.servings).toBe(2);
    expect(mapped.prepTimeMinutes).toBeUndefined();
    expect(mapped.cookTimeMinutes).toBeUndefined();
    expect(mapped.ingredients[0]!.amount).toBe(3);
    expect(mapped.ingredients[1]!.amount).toBeUndefined();
    expect(mapped.steps[0]!.durationMinutes).toBe(5);
    expect(mapped.steps[1]!.durationMinutes).toBeUndefined();
  });

  it('detects platform correctly from URL', () => {
    const youtubeResult = mapExtraction({}, 'en', 'url', 'Recipe', 'https://www.youtube.com/watch?v=123');
    expect(youtubeResult.source.platform).toBe('youtube');

    const tiktokResult = mapExtraction({}, 'en', 'url', 'Recipe', 'https://www.tiktok.com/@user/video/123');
    expect(tiktokResult.source.platform).toBe('tiktok');

    const instaResult = mapExtraction({}, 'en', 'url', 'Recipe', 'https://www.instagram.com/p/123');
    expect(instaResult.source.platform).toBe('instagram');

    const webResult = mapExtraction({}, 'en', 'url', 'Recipe', 'https://mako.co.il/food/123');
    expect(webResult.source.platform).toBe('web');
  });
});
