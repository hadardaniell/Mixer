/**
 * Raw color palette — single source of truth.
 *
 * Each brand/neutral family has a 12-step scale following the Radix convention:
 *   1–2   app backgrounds
 *   3–5   component backgrounds (idle / hover / active)
 *   6–8   borders (subtle / regular / strong)
 *   9     solid brand color (buttons, fills)
 *   10    solid brand hover
 *   11    low-contrast text
 *   12    high-contrast text
 *
 * Status colors are kept as a small set of named slots since they're rarely
 * used across a full scale.
 *
 * To rebrand: change values here. Nothing else in the app references hex
 * values directly — everything goes through tokens + semantic theme aliases.
 */

export type Scale12 = readonly [
  string, string, string, string, string, string,
  string, string, string, string, string, string,
];

// ─── Light mode scales ──────────────────────────────────────────────────────

const primaryLight: Scale12 = [
  '#FDF6F3', // 1  app bg tint
  '#FBEAE2', // 2
  '#F7D5C5', // 3  component bg
  '#F2BCA4', // 4
  '#ECA383', // 5
  '#E58A63', // 6  subtle border
  '#DF7649', // 7  border
  '#DB6A3E', // 8  strong border
  '#D9603B', // 9  solid (terracotta anchor)
  '#C25232', // 10 solid hover
  '#9A3E22', // 11 low-contrast text
  '#5C2412', // 12 high-contrast text
];

const secondaryLight: Scale12 = [
  '#F5F8F2',
  '#E8EFE1',
  '#D5E2C9',
  '#BFD2AC',
  '#A8C28F',
  '#92B274',
  '#7DA25B',
  '#729653',
  '#6B8E5A', // 9 herb green anchor
  '#5E7C4F',
  '#48613C',
  '#2A3A23',
];

const grayLight: Scale12 = [
  '#FAFAF9', // very subtle warm tint vs pure cool gray
  '#F4F3F1',
  '#EAE8E5',
  '#DDDAD5',
  '#CFCBC5',
  '#BAB5AD',
  '#9F9A91',
  '#8A857C',
  '#78736D', // 9
  '#605C56',
  '#43403B', // 11 body text
  '#1F1D1A', // 12 headings
];

// ─── Dark mode scales ───────────────────────────────────────────────────────

const primaryDark: Scale12 = [
  '#1A0F0A',
  '#23150E',
  '#331E15',
  '#43271B',
  '#553224',
  '#6A3E2C',
  '#854C34',
  '#A65A3C',
  '#D9603B', // 9 — keep brand anchor stable across modes
  '#E47550',
  '#F0A187',
  '#FBE2D6',
];

const secondaryDark: Scale12 = [
  '#0F140C',
  '#161D12',
  '#1F2A18',
  '#283820',
  '#324629',
  '#3D5532',
  '#4A663C',
  '#587847',
  '#6B8E5A', // 9
  '#82A571',
  '#B5CDA6',
  '#E2EED9',
];

const grayDark: Scale12 = [
  '#141210',
  '#1A1714',
  '#231F1B',
  '#2C2823',
  '#36312B',
  '#423D36',
  '#524C44',
  '#665F56',
  '#78736D', // 9
  '#948E86',
  '#C5BFB6',
  '#F0EBE4',
];

// ─── Status colors (flat — not a full scale) ────────────────────────────────

const statusLight = {
  successBg: '#E6F2EA',
  successBorder: '#A8D4B5',
  successSolid: '#3F8F5C',
  successText: '#235E3A',

  dangerBg: '#FBE9E7',
  dangerBorder: '#E8A8A3',
  dangerSolid: '#C8453B',
  dangerText: '#7E2620',

  warningBg: '#FBF1DD',
  warningBorder: '#EAC97D',
  warningSolid: '#E0A93D',
  warningText: '#7A5915',

  infoBg: '#E5EFF8',
  infoBorder: '#A5C5E1',
  infoSolid: '#3D7FB8',
  infoText: '#1F4972',
} as const;

const statusDark = {
  successBg: '#16291E',
  successBorder: '#2F5A3E',
  successSolid: '#4FA371',
  successText: '#B8DEC6',

  dangerBg: '#2B1411',
  dangerBorder: '#5C2A24',
  dangerSolid: '#DC5A50',
  dangerText: '#F2BFB9',

  warningBg: '#2B210E',
  warningBorder: '#5A4519',
  warningSolid: '#E8B856',
  warningText: '#F2DCA8',

  infoBg: '#0F1F2D',
  infoBorder: '#2C4B6A',
  infoSolid: '#5B98CC',
  infoText: '#B6D2E8',
} as const;

// ─── Surfaces ───────────────────────────────────────────────────────────────

const surfacesLight = {
  background: '#FFFFFF', // dark teal app bg
  surface: '#FFFFFF', // cards, inputs, sheets (kept light so inputs stay readable)
  surfaceElevated: '#FFFFFF', // modals, menus
  overlay: 'rgba(8, 36, 33, 0.55)', // modal/sheet scrim
  // Foreground colors used on top of `background` (the dark teal).
  // Themes pull these into $text / $textMuted / $textSubtle for light mode
  // so the gray scale stays untouched for components on white surfaces.
  onBackground: '#BCECE0', // mint — primary text on teal
  onBackgroundMuted: 'rgba(188, 236, 224, 0.75)',
  onBackgroundSubtle: 'rgba(188, 236, 224, 0.55)',
  onBackgroundBorder: 'rgba(188, 236, 224, 0.30)',
} as const;

const surfacesDark = {
  background: '#0B3531', // deeper teal for dark mode
  surface: '#231F1B',
  surfaceElevated: '#2C2823',
  overlay: 'rgba(0, 0, 0, 0.6)',
  onBackground: '#BCECE0',
  onBackgroundMuted: 'rgba(188, 236, 224, 0.75)',
  onBackgroundSubtle: 'rgba(188, 236, 224, 0.55)',
  onBackgroundBorder: 'rgba(188, 236, 224, 0.30)',
} as const;

// ─── Exports ────────────────────────────────────────────────────────────────

export const palette = {
  light: {
    primary: primaryLight,
    secondary: secondaryLight,
    gray: grayLight,
    status: statusLight,
    surfaces: surfacesLight,
  },
  dark: {
    primary: primaryDark,
    secondary: secondaryDark,
    gray: grayDark,
    status: statusDark,
    surfaces: surfacesDark,
  },
} as const;

export type PaletteMode = keyof typeof palette;
