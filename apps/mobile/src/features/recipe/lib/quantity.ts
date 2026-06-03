import type { TFunction } from 'i18next';

/**
 * The recipe's authored amounts represent "כמות 1" (×1). The stepper moves
 * along this multiplier ladder: each `+` doubles, each `−` halves, floored at
 * ¼ ("פי שתיים" up, ½ → ¼ down).
 */
export const QUANTITY_LADDER = [0.25, 0.5, 1, 2, 4, 8, 16] as const;

const EPSILON = 0.01;

function approx(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON;
}

function indexOfMultiplier(multiplier: number): number {
  let closest = 0;
  for (let i = 1; i < QUANTITY_LADDER.length; i += 1) {
    if (Math.abs(QUANTITY_LADDER[i] - multiplier) < Math.abs(QUANTITY_LADDER[closest] - multiplier)) {
      closest = i;
    }
  }
  return closest;
}

/** The next multiplier in `direction` (+1 up / −1 down), clamped to the ladder. */
export function stepMultiplier(multiplier: number, direction: 1 | -1): number {
  const next = Math.min(
    Math.max(indexOfMultiplier(multiplier) + direction, 0),
    QUANTITY_LADDER.length - 1,
  );
  return QUANTITY_LADDER[next];
}

/** Whether a step in `direction` stays on the ladder (false at the ends). */
export function canStepMultiplier(multiplier: number, direction: 1 | -1): boolean {
  const next = indexOfMultiplier(multiplier) + direction;
  return next >= 0 && next < QUANTITY_LADDER.length;
}

/** Vulgar-fraction glyph for a fractional part, or null if it isn't a common one. */
function fractionGlyph(frac: number): string | null {
  if (approx(frac, 0.25)) return '¼';
  if (approx(frac, 0.5)) return '½';
  if (approx(frac, 0.75)) return '¾';
  if (approx(frac, 1 / 3)) return '⅓';
  if (approx(frac, 2 / 3)) return '⅔';
  return null;
}

/**
 * Format a scaled ingredient amount, preferring vulgar fractions (½, 1¼) over
 * decimals where the value lands on a common fraction.
 */
export function formatAmount(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  const whole = Math.floor(rounded);
  const glyph = fractionGlyph(rounded - whole);
  if (glyph) return whole > 0 ? `${whole}${glyph}` : glyph;
  return Number(rounded.toFixed(2)).toString();
}

/** The stepper's label: "¼ כמות", "כמות 1", "פי 2", … */
export function formatQuantityLabel(multiplier: number, t: TFunction): string {
  if (multiplier < 1) {
    return t('recipe.quantityFraction', { fraction: fractionGlyph(multiplier) ?? formatAmount(multiplier) });
  }
  if (multiplier === 1) return t('recipe.quantityBase');
  return t('recipe.quantityMultiple', { factor: multiplier });
}
