import * as Localization from 'expo-localization';

/** Dial codes for the regions we care about most; falls back to Israel. */
const DIAL_CODES: Record<string, string> = {
  IL: '972',
  US: '1',
  GB: '44',
  CA: '1',
  AU: '61',
  DE: '49',
  FR: '33',
};

/** The device's default dial code, from its region, defaulting to Israel. */
function defaultDialCode(): string {
  const region = Localization.getLocales()[0]?.regionCode ?? 'IL';
  return DIAL_CODES[region] ?? '972';
}

/**
 * Best-effort normalization of a raw contact phone number to E.164, which is
 * what the server matches on.
 *
 * This is deliberately simple, not a full libphonenumber:
 *   - `+9725…` → kept as-is
 *   - `009725…` → `+9725…`
 *   - `05…` (leading zero, local) → `+<deviceDialCode>5…`
 *   - bare `5…` with no code → assume the device's country
 *
 * It handles the common local-number case well; unusual international formats
 * may not match, which just means that contact won't appear — never an error.
 * Returns null when there aren't enough digits to be a real number.
 */
export function toE164(raw: string, dialCode = defaultDialCode()): string | null {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (hasPlus) {
    // Already international.
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = dialCode + digits.slice(1);
  } else if (!digits.startsWith(dialCode)) {
    digits = dialCode + digits;
  }

  // 8 digits is about the shortest a real national number gets; below that it's
  // an extension or junk.
  if (digits.length < 8) return null;
  return `+${digits}`;
}

/** Normalize + de-duplicate a batch of raw numbers into an E.164 list. */
export function toE164Batch(rawNumbers: string[]): string[] {
  const code = defaultDialCode();
  const set = new Set<string>();
  for (const raw of rawNumbers) {
    const e164 = toE164(raw, code);
    if (e164) set.add(e164);
  }
  return [...set];
}
