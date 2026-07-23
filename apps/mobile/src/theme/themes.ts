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
  searchBarBg: string;
  categoryChipBg: string;
  categoryChipText: string;
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
  /** Label/icon on the ink primary button — white in light, dark in dark. */
  buttonPrimaryText: string;
  /** Hairline on the primary button. The tint fill is barely 1.2:1 against a
   *  white canvas, so without this border the button has no readable edge. */
  buttonPrimaryBorder: string;
  /** Solid brand fill for buttons that carry WHITE text (e.g. the notification
   *  accept action). Deliberately deeper than `$primary`: step 9 is 3.0:1
   *  against white and fails, this is 5.5:1. */
  buttonPrimarySolid: string;

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

  // The cool tint ramp — teal → periwinkle, for step badges and action blobs.
  tintTeal: string;
  tintAqua: string;
  tintSky: string;
  tintPeriwinkle: string;
  tintPink: string;
  tintTealInk: string;
  tintPinkInk: string;

  // Accents — soft named swatches (icon blobs, chips). Direct hues.
  accentLavender: string;
  accentPeach: string;
  accentPink: string;
  accentMint: string;
  accentLime: string;
  accentLimeBright: string;
  accentLimeVivid: string;
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
  accentCharcoal: string;
  accentCloud: string;

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
    searchBarBg: c[k('searchBar')],
    // Category chip (search page): fixed rose tint + slate ink, both modes.
    categoryChipBg: c.lavenderLight,
    categoryChipText: c.gray12Light,
    surfaceElevated: c[k('surfaceElevated')],
    overlay: c[k('overlay')],

    // Text — on the page background (dark teal), so use mint foregrounds.
    // Components on white `surface` (inputs, cards) keep using gray scale.
    text: c[k('onBackground')],
    textMuted: c[k('onBackgroundMuted')],
    textSubtle: c[k('onBackgroundSubtle')],
    // The brand fill is the LIGHT periwinkle tint, so its label is the DARK
    // step 11 — not step 9. Step 9 is 3.0:1 on the tint and would be unreadable.
    textOnPrimary: c[k('primary11')],
    textOnSecondary: mode === 'Light' ? '#FFFFFF' : c.gray1Dark,

    // Borders
    border: c[k('gray6')],
    borderStrong: c[k('gray8')],
    divider: c[k('gray5')],

    // Primary
    primary: c[k('primary9')],
    primaryHover: c[k('primary10')],
    primarySubtle: c[k('primary3')],
    // The primary button is INK, not periwinkle — "black = action" across the
    // whole app, matching the ink discs (FAB, quick actions, back). Periwinkle
    // stays the brand accent for chips / active states / links, but is no longer
    // a button fill. Uses the secondary (ink) scale so it's theme-aware: ink in
    // light, bone in dark, with `buttonPrimaryText` flipping to match.
    buttonPrimaryBg: c[k('secondary9')],
    buttonPrimaryBgHover: c[k('secondary10')],
    buttonPrimaryBgPress: c[k('secondary11')],
    buttonPrimaryText: mode === 'Light' ? '#FFFFFF' : c.gray1Dark,
    // Kept for `EditProfile` etc. that still draw a tinted-outline button; not
    // the primary button anymore.
    buttonPrimaryBorder: c[k('primary4')],
    buttonPrimarySolid: c[k('primary10')],

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

    // Cool tint ramp
    tintTeal: c[k('tintTeal')],
    tintAqua: c[k('tintAqua')],
    tintSky: c[k('tintSky')],
    tintPeriwinkle: c[k('tintPeriwinkle')],
    tintPink: c[k('tintPink')],
    tintTealInk: c[k('tintTealInk')],
    tintPinkInk: c[k('tintPinkInk')],

    // Accents
    accentLavender: c[k('lavender')],
    accentPeach: c[k('peach')],
    accentPink: c[k('pink')],
    accentMint: c[k('mint')],
    accentLime: c[k('lime')],
    accentLimeBright: c[k('limeBright')],
    accentLimeVivid: c[k('limeVivid')],
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
    accentCharcoal: c[k('charcoal')],
    accentCloud: c[k('cloud')],

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
