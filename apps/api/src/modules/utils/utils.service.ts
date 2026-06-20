import { INGREDIENTS_DATA, HEBREW_UNIT_MAP, GENERAL_VOLUMES, type UnitType, type IngredientData } from './utils.data.js';

type ToGramsConverter = (amount: number, ingredientData: IngredientData) => number | null;
type FromGramsConverter = (amountInGrams: number, ingredientData: IngredientData) => number | null;

const TO_GRAMS_CONVERTERS: Partial<Record<UnitType, ToGramsConverter>> = {
  g: (amount) => amount,
  kg: (amount) => amount * 1000,
};

const FROM_GRAMS_CONVERTERS: Partial<Record<UnitType, FromGramsConverter>> = {
  g: (amountInGrams) => amountInGrams,
  kg: (amountInGrams) => amountInGrams / 1000,
};

const TO_GRAMS_STRATEGIES: {
  match: (unit: UnitType, data: IngredientData) => boolean;
  convert: (amount: number, unit: UnitType, data: IngredientData) => number;
}[] = [
  {
    match: (unit) => unit in TO_GRAMS_CONVERTERS,
    convert: (amount, unit, data) => TO_GRAMS_CONVERTERS[unit]!(amount, data)!,
  },
  {
    match: (unit, data) => data.units[unit] !== undefined,
    convert: (amount, unit, data) => amount * data.units[unit]!,
  },
  {
    match: (unit, data) => data.units.ml !== undefined && GENERAL_VOLUMES[unit] !== undefined,
    convert: (amount, unit, data) => amount * GENERAL_VOLUMES[unit]! * data.units.ml!,
  },
];

const FROM_GRAMS_STRATEGIES: {
  match: (unit: UnitType, data: IngredientData) => boolean;
  convert: (amountInGrams: number, unit: UnitType, data: IngredientData) => number;
}[] = [
  {
    match: (unit) => unit in FROM_GRAMS_CONVERTERS,
    convert: (amountInGrams, unit, data) => FROM_GRAMS_CONVERTERS[unit]!(amountInGrams, data)!,
  },
  {
    match: (unit, data) => data.units[unit] !== undefined,
    convert: (amountInGrams, unit, data) => amountInGrams / data.units[unit]!,
  },
  {
    match: (unit, data) => data.units.ml !== undefined && GENERAL_VOLUMES[unit] !== undefined,
    convert: (amountInGrams, unit, data) => (amountInGrams / data.units.ml!) / GENERAL_VOLUMES[unit]!,
  },
];

export class UtilsService {
  /**
   * Converts a given amount of an ingredient from one unit to another.
   * Default target unit is 'גרם' (grams).
   */
  public convertUnit(
    ingredientName: string,
    amount: number,
    fromUnitHebrew: string,
    toUnitHebrew: string = 'גרם',
  ): { result: number | null; message: string } {
    if (typeof ingredientName !== 'string') return { result: null, message: 'Ingredient must be a string' };
    if (typeof fromUnitHebrew !== 'string') return { result: null, message: 'Source unit must be a string' };
    if (typeof toUnitHebrew !== 'string') return { result: null, message: 'Target unit must be a string' };

    const normalizedIngredient = ingredientName.trim().toLowerCase();
    const fromUnitStr = fromUnitHebrew.trim().toLowerCase();
    const toUnitStr = toUnitHebrew.trim().toLowerCase();

    const fromUnit: UnitType = HEBREW_UNIT_MAP[fromUnitStr] || (fromUnitStr as UnitType);
    const toUnit: UnitType = HEBREW_UNIT_MAP[toUnitStr] || (toUnitStr as UnitType);

    // Find the closest matching ingredient based on aliases (exact match first, then partial match)
    let ingredientData = INGREDIENTS_DATA.find((item) =>
      item.aliases.some((alias) => alias === normalizedIngredient),
    );

    if (!ingredientData) {
      ingredientData = INGREDIENTS_DATA.find((item) =>
        item.aliases.some((alias) => normalizedIngredient.includes(alias) || alias.includes(normalizedIngredient)),
      );
    }

    if (!ingredientData) {
      if (toUnit === 'ml' && GENERAL_VOLUMES[fromUnit]) {
        return { result: amount * GENERAL_VOLUMES[fromUnit]!, message: 'Converted using general volume' };
      }
      return { result: null, message: 'Ingredient not found for specific conversion' };
    }

    // Step 1: Convert from source unit to grams
    const toGramsStrategy = TO_GRAMS_STRATEGIES.find((s) => s.match(fromUnit, ingredientData));

    if (!toGramsStrategy) {
      if (GENERAL_VOLUMES[fromUnit]) {
        return { result: null, message: `Unit '${fromUnitHebrew}' is not supported for ingredient '${ingredientName}'` };
      }
      return { result: null, message: `Unit '${fromUnitHebrew}' is not recognized` };
    }

    const amountInGrams = toGramsStrategy.convert(amount, fromUnit, ingredientData);

    // Step 2: Convert from grams to target unit
    const fromGramsStrategy = FROM_GRAMS_STRATEGIES.find((s) => s.match(toUnit, ingredientData));

    if (!fromGramsStrategy) {
      return { result: null, message: `Target unit '${toUnitHebrew}' is not supported for ingredient '${ingredientName}'` };
    }

    const finalAmount = fromGramsStrategy.convert(amountInGrams, toUnit, ingredientData);
    const decimalPlaces = toUnit === 'kg' ? 3 : 2;

    return { result: Number(finalAmount.toFixed(decimalPlaces)), message: 'Success' };
  }
}