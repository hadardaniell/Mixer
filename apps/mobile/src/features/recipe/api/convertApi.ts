import { http } from '@/shared/lib/httpClient';

interface ConvertResponse {
  convertedAmount: number;
  targetUnit: string;
}

// Cache promises by (ingredient, amount, fromUnit, toUnit) so probing a row's
// units — and re-opening the same row — never hits the network twice.
const cache = new Map<string, Promise<number | null>>();

async function doConvert(
  ingredient: string,
  amount: number,
  fromUnit: string,
  toUnit: string,
): Promise<number | null> {
  const res = await http<ConvertResponse>('/utils/convert', {
    method: 'POST',
    body: JSON.stringify({ ingredient, amount, fromUnit, toUnit }),
  });
  return res.convertedAmount;
}

/**
 * Ask the server to convert `amount fromUnit` of `ingredient` into `toUnit`.
 * Resolves to the converted amount, or `null` when the ingredient/unit pair
 * isn't convertible (the server answers 400) — callers use `null` to hide that
 * option. Results are cached and deduped across the session.
 */
export function convertUnit(
  ingredient: string,
  amount: number,
  fromUnit: string,
  toUnit: string,
): Promise<number | null> {
  const key = `${ingredient}|${amount}|${fromUnit}|${toUnit}`;
  let p = cache.get(key);
  if (!p) {
    p = doConvert(ingredient, amount, fromUnit, toUnit).catch(() => null);
    cache.set(key, p);
  }
  return p;
}
