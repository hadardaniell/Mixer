/**
 * Semantic theme aliases.
 *
 * Screens reference these via `$aliasName` (e.g. `$bg`, `$buttonPrimaryBg`).
 * Each alias maps to a token from `tokens.ts`. To re-skin the app, change
 * which token an alias points to here — not in screens.
 */

import { colorTokens } from './tokens';

type ThemeShape = {
  // Surfaces
  bg: string;
  bgSubtle: string;
  surface: string;
  surfaceElevated: string;
  overlay: string;

  // Text
  text: string;
  textMuted: string;
  textSubtle: string;
  textOnPrimary: string; // text/icon on top of $buttonPrimaryBg
  textOnSecondary: string;

  // Borders / dividers
  border: string;
  borderStrong: string;
  divider: string;

  // Brand — primary
  primary: string;
  primaryHover: string;
  primarySubtle: string; // tinted bg (e.g. selected row)
  buttonPrimaryBg: string;
  buttonPrimaryBgHover: string;
  buttonPrimaryBgPress: string;

  // Brand — secondary (lime / action)
  secondary: string;
  secondaryHover: string;
  secondarySubtle: string;
  buttonSecondaryBg: string;
  buttonSecondaryBgHover: string;

  // Floating action button (center nav). Lime fill, dark ink on top.
  fab: string;
  fabHover: string;
  fabText: string;

  // Accents — soft named swatches (icon blobs, chips). Direct hues.
  accentLavender: string;
  accentPeach: string;
  accentPink: string;
  accentMint: string;
  accentLime: string;
  accentLimeBright: string;
  accentTeal: string;
  accentBlue: string;
  accentCoral: string;
  accentYellow: string;
  accentOrange: string;
  accentSeafoam: string;
  accentGreen: string;
  accentIndigo: string;
  accentPurple: string;
  accentBrown: string;
  accentBlueGray: string;

  // Inputs
  inputBg: string;
  inputBorder: string;
  inputBorderFocus: string;
  inputPlaceholder: string;

  // Links
  linkText: string;
  linkTextHover: string;

  // Status — text + soft bg variants for banners/toasts
  success: string;
  successBg: string;
  successBorder: string;
  successText: string;

  danger: string;
  dangerBg: string;
  dangerBorder: string;
  dangerText: string;

  warning: string;
  warningBg: string;
  warningBorder: string;
  warningText: string;

  info: string;
  infoBg: string;
  infoBorder: string;
  infoText: string;

  // Tamagui built-in keys (kept so default components don't break)
  background: string;
  color: string;
  borderColor: string;
};

const buildTheme = (mode: 'Light' | 'Dark'): ThemeShape => {
  const c = colorTokens;
  const k = <T extends string>(key: T) => `${key}${mode}` as const;

  return {
    // Surfaces
    bg: c[k('background')],
    bgSubtle: c[k('gray2')],
    surface: c[k('surface')],
    surfaceElevated: c[k('surfaceElevated')],
    overlay: c[k('overlay')],

    // Text — on the page background (dark teal), so use mint foregrounds.
    // Components on white `surface` (inputs, cards) keep using gray scale.
    text: c[k('onBackground')],
    textMuted: c[k('onBackgroundMuted')],
    textSubtle: c[k('onBackgroundSubtle')],
    textOnPrimary: '#FFFFFF',
    textOnSecondary: c[k('gray12')], // dark ink on lime

    // Borders
    border: c[k('gray6')],
    borderStrong: c[k('gray8')],
    divider: c[k('gray5')],

    // Primary
    primary: c[k('primary9')],
    primaryHover: c[k('primary10')],
    primarySubtle: c[k('primary3')],
    buttonPrimaryBg: c[k('primary9')],
    buttonPrimaryBgHover: c[k('primary10')],
    buttonPrimaryBgPress: c[k('primary11')],

    // Secondary
    secondary: c[k('secondary9')],
    secondaryHover: c[k('secondary10')],
    secondarySubtle: c[k('secondary3')],
    buttonSecondaryBg: c[k('secondary9')],
    buttonSecondaryBgHover: c[k('secondary10')],

    // FAB
    fab: c[k('secondary9')],
    fabHover: c[k('secondary10')],
    fabText: c[k('gray12')],

    // Accents
    accentLavender: c[k('lavender')],
    accentPeach: c[k('peach')],
    accentPink: c[k('pink')],
    accentMint: c[k('mint')],
    accentLime: c[k('lime')],
    accentLimeBright: c[k('limeBright')],
    accentTeal: c[k('teal')],
    accentBlue: c[k('blue')],
    accentCoral: c[k('coral')],
    accentYellow: c[k('yellow')],
    accentOrange: c[k('orange')],
    accentSeafoam: c[k('seafoam')],
    accentGreen: c[k('green')],
    accentIndigo: c[k('indigo')],
    accentPurple: c[k('purple')],
    accentBrown: c[k('brown')],
    accentBlueGray: c[k('blueGray')],

    // Inputs
    inputBg: c[k('surface')],
    inputBorder: c[k('gray7')],
    inputBorderFocus: c[k('primary8')],
    inputPlaceholder: c[k('gray10')],

    // Links
    linkText: c[k('primary11')],
    linkTextHover: c[k('primary10')],

    // Status
    success: c[k('successSolid')],
    successBg: c[k('successBg')],
    successBorder: c[k('successBorder')],
    successText: c[k('successText')],

    danger: c[k('dangerSolid')],
    dangerBg: c[k('dangerBg')],
    dangerBorder: c[k('dangerBorder')],
    dangerText: c[k('dangerText')],

    warning: c[k('warningSolid')],
    warningBg: c[k('warningBg')],
    warningBorder: c[k('warningBorder')],
    warningText: c[k('warningText')],

    info: c[k('infoSolid')],
    infoBg: c[k('infoBg')],
    infoBorder: c[k('infoBorder')],
    infoText: c[k('infoText')],

    // Tamagui built-ins
    background: c[k('background')],
    color: c[k('gray12')],
    borderColor: c[k('gray6')],
  };
};

export const themes = {
  light: buildTheme('Light'),
  dark: buildTheme('Dark'),
} as const;

export type AppTheme = typeof themes.light;
