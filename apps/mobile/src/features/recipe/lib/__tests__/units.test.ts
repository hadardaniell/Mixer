import { describe, expect, it } from 'vitest';
import { MEASUREMENT_UNITS } from '../units';

describe('MEASUREMENT_UNITS', () => {
  it('contains expected core units', () => {
    const values = MEASUREMENT_UNITS.map((u) => u.value);
    expect(values).toContain('כוס');
    expect(values).toContain('כף');
    expect(values).toContain('כפית');
    expect(values).toContain('גרם');
    expect(values).toContain('ק"ג');
  });

  it('correctly flags convertible vs non-convertible units', () => {
    const cup = MEASUREMENT_UNITS.find((u) => u.value === 'כוס');
    expect(cup?.convertible).toBe(true);

    const unit = MEASUREMENT_UNITS.find((u) => u.value === 'יחידה');
    expect(unit?.convertible).toBe(false);

    const toTaste = MEASUREMENT_UNITS.find((u) => u.value === 'לפי הטעם');
    expect(toTaste?.convertible).toBe(false);
  });
});
