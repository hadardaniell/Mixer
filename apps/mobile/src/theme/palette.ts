/**
 * Raw color palette — single source of truth.
 *
 * Encodes the product design language:
 *   • Brand primary  → violet  (lavender tint #ECE8FF, solid #7C5CFC)
 *   • Brand secondary→ lime    (tint #D9F99D, vivid action/FAB #A3D40C)
 *   • Neutral gray   → cool slate (#F6F7F9 bg … #6B7280 muted … #111827 ink)
 *   • Accents        → the named swatches used as soft icon "blobs" / chips
 *
 * Each brand/neutral family is a 12-step scale following the Radix convention:
 *   1–2   app backgrounds
 *   3–5   component backgrounds (idle / hover / active)
 *   6–8   borders (subtle / regular / strong)
 *   9     solid brand color (buttons, fills)
 *   10    solid brand hover
 *   11    low-contrast text
 *   12    high-contrast text
 *
 * Status colors and accents are flat named slots since they're rarely used
 * across a full scale.
 *
 * To rebrand: change values here. Nothing else in the app references hex
 * values directly — everything goes through tokens + semantic theme aliases.
 */

export type Scale12 = readonly [
  string, string, string, string, string, string,
  string, string, string, string, string, string,
];

// ─── Light mode scales ──────────────────────────────────────────────────────

// Primary — violet
const primaryLight: Scale12 = [
  '#F6F4FF', // 1  app bg tint
  '#ECE8FF', // 2  lavender (design swatch)
  '#DED7FF', // 3  component bg
  '#CDC0FF', // 4
  '#B9A6FB', // 5
  '#A48CF4', // 6  subtle border
  '#8E72EC', // 7  border
  '#7E5EE4', // 8  strong border
  '#7C5CFC', // 9  solid (violet anchor)
  '#6A49E0', // 10 solid hover
  '#5536C0', // 11 low-contrast text
  '#2E1C6B', // 12 high-contrast text
];

// Secondary — lime / action green
const secondaryLight: Scale12 = [
  '#F8FCEB', // 1
  '#F0FAD6', // 2
  '#E4F6B3', // 3  component bg
  '#D9F99D', // 4  lime (design swatch)
  '#CBEE85', // 5
  '#BBE266', // 6  subtle border
  '#A9D447', // 7  border
  '#98C32E', // 8  strong border
  '#A3D40C', // 9  vivid lime (FAB / action anchor)
  '#8FB80A', // 10 solid hover
  '#5E7A0A', // 11 low-contrast text
  '#2F3D0A', // 12 high-contrast text
];

// Neutral — cool slate
const grayLight: Scale12 = [
  '#F6F7F9', // 1  app bg (design swatch)
  '#F0F1F4', // 2
  '#E7E9EE', // 3  component bg
  '#DDE0E6', // 4
  '#D2D6DE', // 5
  '#C3C8D2', // 6  subtle border
  '#AEB4C0', // 7  border
  '#8E95A4', // 8  strong border
  '#6B7280', // 9  muted (design swatch)
  '#565D6A', // 10
  '#3F4651', // 11 body text
  '#111827', // 12 headings / ink (design swatch)
];

// ─── Dark mode scales ───────────────────────────────────────────────────────

const primaryDark: Scale12 = [
  '#120F22',
  '#1A152E',
  '#241D40',
  '#2E2552',
  '#3A2F66',
  '#473A7C',
  '#574894',
  '#6A58B8',
  '#7C5CFC', // 9 — keep brand anchor stable across modes
  '#9176FF',
  '#BCA9FF',
  '#E7E0FF',
];

const secondaryDark: Scale12 = [
  '#121707',
  '#19200B',
  '#222C10',
  '#2C3915',
  '#37471A',
  '#445721',
  '#536A28',
  '#688A2F',
  '#A3D40C', // 9
  '#B6E62A',
  '#CEF06B',
  '#E9FAC0',
];

const grayDark: Scale12 = [
  '#0E1117',
  '#141822',
  '#1B2230',
  '#232C3C',
  '#2C3647',
  '#374253',
  '#465264',
  '#5B697C',
  '#6B7280', // 9
  '#8A93A2',
  '#C0C7D2',
  '#F1F3F7',
];

// ─── Status colors (flat — not a full scale) ────────────────────────────────

const statusLight = {
  successBg: '#E6F7F1',
  successBorder: '#9FE0CB',
  successSolid: '#14B8A6',
  successText: '#0B6B5F',

  dangerBg: '#FFECEF',
  dangerBorder: '#FFB3C0',
  dangerSolid: '#FF4D6D',
  dangerText: '#9B1B36',

  warningBg: '#FFF6E0',
  warningBorder: '#FFD98A',
  warningSolid: '#FFB74D',
  warningText: '#8A5A10',

  infoBg: '#E8EEFE',
  infoBorder: '#A9C2F8',
  infoSolid: '#2563EB',
  infoText: '#1A3F94',
} as const;

const statusDark = {
  successBg: '#0C231F',
  successBorder: '#1E4A41',
  successSolid: '#19C5B2',
  successText: '#9FE6D8',

  dangerBg: '#2B1117',
  dangerBorder: '#5C2531',
  dangerSolid: '#FF647F',
  dangerText: '#FFB8C4',

  warningBg: '#2B210C',
  warningBorder: '#5A451A',
  warningSolid: '#FFC368',
  warningText: '#F2D9A8',

  infoBg: '#0E1A33',
  infoBorder: '#27407A',
  infoSolid: '#4B82F0',
  infoText: '#B5CBF7',
} as const;

// ─── Accents (named design swatches — soft icon blobs / chips) ───────────────

const accentsLight = {
  lavender: '#ECE8FF',
  peach: '#FFF2E6',
  pink: '#FFECEF',
  mint: '#E6F7F1',
  lime: '#D9F99D',
  limeBright: '#BFED39',
  teal: '#14B8A6',
  blue: '#2563EB',
  coral: '#FF4D6D',
  yellow: '#FFD54F',
  orange: '#FFB74D',
  seafoam: '#4DB6AC',
  green: '#81C784',
  indigo: '#7986CB',
  purple: '#BA68C8',
  brown: '#A1887F',
  blueGray: '#90A4AE',
} as const;

// Slightly deepened so the same hues read on dark surfaces.
const accentsDark = {
  lavender: '#3A2F66',
  peach: '#3D3322',
  pink: '#3A222A',
  mint: '#143029',
  lime: '#2C3915',
  limeBright: '#BFED39',
  teal: '#0F8C7F',
  blue: '#3B74E8',
  coral: '#E84566',
  yellow: '#E6BE47',
  orange: '#E6A645',
  seafoam: '#3F9E95',
  green: '#6FB073',
  indigo: '#6B78B8',
  purple: '#A65BB3',
  brown: '#8E776F',
  blueGray: '#7E909C',
} as const;

// ─── Surfaces ───────────────────────────────────────────────────────────────

const surfacesLight = {
  background: '#FCFCFC', // app canvas — rgb(252, 252, 252)
  surface: '#FFFFFF', // cards, inputs, sheets, nav bar
  surfaceElevated: '#FFFFFF', // modals, menus
  overlay: 'rgba(17, 24, 39, 0.50)', // modal/sheet scrim
  // Foregrounds used on top of `background`. With a light canvas these are the
  // dark ink/muted values; themes pull them into $text / $textMuted etc.
  onBackground: '#111827',
  onBackgroundMuted: '#6B7280',
  onBackgroundSubtle: '#9CA3AF',
  onBackgroundBorder: 'rgba(17, 24, 39, 0.10)',
} as const;

const surfacesDark = {
  background: '#0E1117',
  surface: '#1B2230',
  surfaceElevated: '#232C3C',
  overlay: 'rgba(0, 0, 0, 0.6)',
  onBackground: '#F1F3F7',
  onBackgroundMuted: '#AEB6C2',
  onBackgroundSubtle: '#7E8696',
  onBackgroundBorder: 'rgba(241, 243, 247, 0.14)',
} as const;

// ─── Exports ────────────────────────────────────────────────────────────────

export const palette = {
  light: {
    primary: primaryLight,
    secondary: secondaryLight,
    gray: grayLight,
    status: statusLight,
    accents: accentsLight,
    surfaces: surfacesLight,
  },
  dark: {
    primary: primaryDark,
    secondary: secondaryDark,
    gray: grayDark,
    status: statusDark,
    accents: accentsDark,
    surfaces: surfacesDark,
  },
} as const;

export const APP_BACKGROUND_COLOR = surfacesLight.background;

export type PaletteMode = keyof typeof palette;
