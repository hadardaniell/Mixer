import type { Recipe } from '@mixer/contracts';
import type { TFunction } from 'i18next';

import { formatAmount } from './quantity';

/**
 * Renders a recipe as plain text for pasting into WhatsApp and friends. Kept to
 * bare newlines and simple bullets — chat apps mangle markdown, and WhatsApp's
 * own `*bold*` syntax would show as literal asterisks everywhere else.
 *
 * `multiplier` mirrors the servings stepper on screen, so what you copy matches
 * what you're looking at.
 */
export function recipeToText(recipe: Recipe, t: TFunction, multiplier = 1): string {
  const blocks: string[] = [recipe.title];

  if (recipe.description) blocks.push(recipe.description);

  if (recipe.ingredients.length > 0) {
    const lines = recipe.ingredients.map((ing) => {
      const amount = ing.amount != null ? formatAmount(ing.amount * multiplier) : undefined;
      return `• ${[amount, ing.unit, ing.name].filter(Boolean).join(' ')}`;
    });
    blocks.push([t('recipe.ingredients'), ...lines].join('\n'));
  }

  if (recipe.steps.length > 0) {
    const lines = recipe.steps.map((step, i) => `${i + 1}. ${step.text}`);
    blocks.push([t('recipe.preparation'), ...lines].join('\n'));
  }

  return blocks.join('\n\n');
}
