import { INGREDIENTS_DATA, HEBREW_UNIT_MAP, GENERAL_VOLUMES, type UnitType } from './utils.data.js';

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

    // Find the closest matching ingredient based on aliases
    const ingredientData = INGREDIENTS_DATA.find((item) =>
      item.aliases.some((alias) => normalizedIngredient.includes(alias) || alias.includes(normalizedIngredient)),
    );

    if (!ingredientData) {
      if (toUnit === 'ml' && GENERAL_VOLUMES[fromUnit]) {
        return { result: amount * GENERAL_VOLUMES[fromUnit]!, message: 'Converted using general volume' };
      }
      return { result: null, message: 'Ingredient not found for specific conversion' };
    }

    // Step 1: Convert from source unit to grams
    let amountInGrams: number | null = null;

    if (fromUnit === 'g') {
      amountInGrams = amount;
    } else if (fromUnit === 'kg') {
      amountInGrams = amount * 1000;
    } else if (ingredientData.units[fromUnit]) {
      amountInGrams = amount * ingredientData.units[fromUnit]!;
    } else if (ingredientData.units.ml && GENERAL_VOLUMES[fromUnit]) {
      const volumeInMl = amount * GENERAL_VOLUMES[fromUnit]!;
      amountInGrams = volumeInMl * ingredientData.units.ml;
    } else if (GENERAL_VOLUMES[fromUnit]) {
      return { result: null, message: `Unit '${fromUnitHebrew}' is not supported for ingredient '${ingredientName}'` };
    } else {
      return { result: null, message: `Unit '${fromUnitHebrew}' is not recognized` };
    }

    // Step 2: Convert from grams to target unit
    if (toUnit === 'g') {
      return { result: Number(amountInGrams.toFixed(2)), message: 'Success' };
    } else if (toUnit === 'kg') {
      return { result: Number((amountInGrams / 1000).toFixed(3)), message: 'Success' };
    }

    let finalAmount: number | null = null;

    if (ingredientData.units[toUnit]) {
      finalAmount = amountInGrams / ingredientData.units[toUnit]!;
    } else if (ingredientData.units.ml && GENERAL_VOLUMES[toUnit]) {
      const volumeInMl = amountInGrams / ingredientData.units.ml;
      finalAmount = volumeInMl / GENERAL_VOLUMES[toUnit]!;
    } else {
      return { result: null, message: `Target unit '${toUnitHebrew}' is not supported for ingredient '${ingredientName}'` };
    }

    return { result: Number(finalAmount.toFixed(2)), message: 'Success' };
  }
}