import { describe, expect, it } from 'vitest';
import {
  QUANTITY_LADDER,
  stepMultiplier,
  canStepMultiplier,
  formatAmount,
  formatQuantityLabel,
} from '../quantity';

describe('quantity module', () => {
  describe('QUANTITY_LADDER & stepper', () => {
    it('defines correct multiplier steps', () => {
      expect(QUANTITY_LADDER).toEqual([0.25, 0.5, 1, 2, 4, 8, 16]);
    });

    it('steps up multiplier correctly', () => {
      expect(stepMultiplier(1, 1)).toBe(2);
      expect(stepMultiplier(2, 1)).toBe(4);
      expect(stepMultiplier(0.25, 1)).toBe(0.5);
    });

    it('steps down multiplier correctly', () => {
      expect(stepMultiplier(1, -1)).toBe(0.5);
      expect(stepMultiplier(0.5, -1)).toBe(0.25);
    });

    it('clamps stepper at ladder boundaries', () => {
      expect(stepMultiplier(16, 1)).toBe(16);
      expect(stepMultiplier(0.25, -1)).toBe(0.25);

      expect(canStepMultiplier(16, 1)).toBe(false);
      expect(canStepMultiplier(0.25, -1)).toBe(false);
      expect(canStepMultiplier(1, 1)).toBe(true);
      expect(canStepMultiplier(1, -1)).toBe(true);
    });
  });

  describe('formatAmount', () => {
    it('formats common vulgar fractions', () => {
      expect(formatAmount(0.25)).toBe('¼');
      expect(formatAmount(0.5)).toBe('½');
      expect(formatAmount(0.75)).toBe('¾');
      expect(formatAmount(1.5)).toBe('1½');
      expect(formatAmount(2.25)).toBe('2¼');
    });

    it('formats whole numbers and arbitrary decimals', () => {
      expect(formatAmount(1)).toBe('1');
      expect(formatAmount(3)).toBe('3');
      expect(formatAmount(1.2)).toBe('1.2');
      expect(formatAmount(2.333)).toBe('2⅓');
    });
  });

  describe('formatQuantityLabel', () => {
    const mockT = ((key: string, options?: any) => {
      if (key === 'recipe.quantityBase') return 'כמות 1';
      if (key === 'recipe.quantityFraction') return `${options.fraction} כמות`;
      if (key === 'recipe.quantityMultiple') return `פי ${options.factor}`;
      return key;
    }) as any;

    it('formats base quantity (1x)', () => {
      expect(formatQuantityLabel(1, mockT)).toBe('כמות 1');
    });

    it('formats fraction quantities (< 1x)', () => {
      expect(formatQuantityLabel(0.5, mockT)).toBe('½ כמות');
      expect(formatQuantityLabel(0.25, mockT)).toBe('¼ כמות');
    });

    it('formats multiple quantities (> 1x)', () => {
      expect(formatQuantityLabel(2, mockT)).toBe('פי 2');
      expect(formatQuantityLabel(4, mockT)).toBe('פי 4');
    });
  });
});
