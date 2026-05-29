/**
 * Tamagui color tokens — flat registry built from `palette.ts`.
 *
 * Every color the app can ever reference lives here, prefixed with its mode
 * (`Light` / `Dark`). Themes (see `themes.ts`) pick from this registry to
 * build the semantic aliases that screens actually use (`$bg`, `$text`,
 * `$buttonPrimaryBg`, etc.).
 *
 * Screens should NOT reference these tokens directly — use the semantic
 * theme aliases instead. The naming here exists only so themes have a
 * single registry to point at.
 */

import { createTokens } from 'tamagui';
import { tokens as defaultTokens } from '@tamagui/config/v3';

import { palette, type Scale12 } from './palette';

type ScaleKey =
  | 'primary1' | 'primary2' | 'primary3' | 'primary4'
  | 'primary5' | 'primary6' | 'primary7' | 'primary8'
  | 'primary9' | 'primary10' | 'primary11' | 'primary12'
  | 'secondary1' | 'secondary2' | 'secondary3' | 'secondary4'
  | 'secondary5' | 'secondary6' | 'secondary7' | 'secondary8'
  | 'secondary9' | 'secondary10' | 'secondary11' | 'secondary12'
  | 'gray1' | 'gray2' | 'gray3' | 'gray4'
  | 'gray5' | 'gray6' | 'gray7' | 'gray8'
  | 'gray9' | 'gray10' | 'gray11' | 'gray12';

function spread(family: 'primary' | 'secondary' | 'gray', scale: Scale12) {
  const out = {} as Record<ScaleKey, string>;
  scale.forEach((hex, i) => {
    out[`${family}${i + 1}` as ScaleKey] = hex;
  });
  return out;
}

function modeColors(mode: 'light' | 'dark') {
  const p = palette[mode];
  return {
    ...spread('primary', p.primary),
    ...spread('secondary', p.secondary),
    ...spread('gray', p.gray),
    ...p.status,
    ...p.accents,
    ...p.surfaces,
  };
}

const light = modeColors('light');
const dark = modeColors('dark');

// Suffix every color with its mode so themes can reference both sets from a
// single flat token registry.
const suffixed = <T extends Record<string, string>>(
  src: T,
  suffix: 'Light' | 'Dark',
) =>
  Object.fromEntries(
    Object.entries(src).map(([k, v]) => [`${k}${suffix}`, v]),
  ) as { [K in keyof T as `${string & K}${typeof suffix}`]: string };

export const colorTokens = {
  ...suffixed(light, 'Light'),
  ...suffixed(dark, 'Dark'),
} as const;

export const tokens = createTokens({
  ...defaultTokens,
  color: {
    ...defaultTokens.color,
    ...colorTokens,
  },
});

export type ColorTokenName = keyof typeof colorTokens;
