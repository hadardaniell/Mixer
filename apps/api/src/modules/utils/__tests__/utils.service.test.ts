import { describe, expect, it } from 'vitest';
import { UtilsService } from '../utils.service.js';

describe('UtilsService unit conversion', () => {
  const service = new UtilsService();

  it('converts grams to kg', () => {
    const res = service.convertUnit('קמח', 500, 'גרם', 'ק"ג');
    expect(res.result).toBe(0.5);
    expect(res.message).toBe('Success');
  });

  it('converts kg to grams', () => {
    const res = service.convertUnit('סוכר', 1.5, 'ק"ג', 'גרם');
    expect(res.result).toBe(1500);
    expect(res.message).toBe('Success');
  });

  it('handles general volume conversions when ingredient is not in specific database', () => {
    const res = service.convertUnit('רכיב לא ידוע', 2, 'כוס', 'מ"ל');
    expect(res.result).toBe(480); // 2 * 240ml
    expect(res.message).toBe('Converted using general volume');
  });

  it('returns null for unhandled conversions', () => {
    const res = service.convertUnit('רכיב לא ידוע', 1, 'קורט', 'ק"ג');
    expect(res.result).toBeNull();
  });

  it('validates input types', () => {
    const res = service.convertUnit(123 as any, 1, 'גרם', 'ק"ג');
    expect(res.result).toBeNull();
    expect(res.message).toBe('Ingredient must be a string');
  });
});
