export interface UnitOption {
  /** The value stored on the ingredient — must be a Hebrew string the server's
   *  conversion table (`HEBREW_UNIT_MAP` in the API) recognizes, so anything
   *  picked here can be converted. */
  value: string;
  label: string;
  /** Whether the server can convert this unit (drives grouping in the picker). */
  convertible: boolean;
}

/**
 * The measurement units offered when authoring an ingredient — a fixed lookup
 * table instead of free text, so every unit is spelled the way the server's
 * unit-conversion expects. The `convertible` set mirrors the API's
 * `HEBREW_UNIT_MAP`; the rest are common piece/qualitative units the server
 * can't weigh (and the recipe page simply won't offer conversion for them).
 */
export const MEASUREMENT_UNITS: UnitOption[] = [
  { value: 'כוס', label: 'כוס', convertible: true },
  { value: 'כף', label: 'כף', convertible: true },
  { value: 'כפית', label: 'כפית', convertible: true },
  { value: 'גרם', label: 'גרם', convertible: true },
  { value: 'ק"ג', label: 'ק״ג', convertible: true },
  { value: 'מ"ל', label: 'מ״ל', convertible: true },
  { value: 'שקית', label: 'שקית', convertible: true },
  { value: 'מיכל', label: 'מיכל', convertible: true },
  { value: 'גביע', label: 'גביע', convertible: true },
  { value: 'חבילה', label: 'חבילה', convertible: true },
  { value: 'חבילה קטנה', label: 'חבילה קטנה', convertible: true },
  { value: 'קובייה', label: 'קובייה', convertible: true },
  { value: 'מקל', label: 'מקל', convertible: true },
  { value: 'עלה', label: 'עלה', convertible: true },
  { value: 'חלבון', label: 'חלבון', convertible: true },
  { value: 'חלמון', label: 'חלמון', convertible: true },
  { value: 'יחידה', label: 'יחידה', convertible: false },
  { value: 'קורט', label: 'קורט', convertible: false },
  { value: 'חופן', label: 'חופן', convertible: false },
  { value: 'לפי הטעם', label: 'לפי הטעם', convertible: false },
];
