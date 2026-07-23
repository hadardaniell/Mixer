/**
 * Raw color palette — single source of truth.
 *
 * Encodes the product design language:
 *   • Brand primary  → periwinkle (tint #E8EDFF, vivid #6C8EFF, text #33409E)
 *   • Brand secondary→ ink        (neutral dark solids)
 *   • Neutral gray   → cool slate (#F6F7F9 bg … #6B7280 muted … #111827 ink)
 *   • Accents        → the named swatches used as soft tints
 *
 * The brand uses THREE steps with distinct jobs, and mixing them up breaks
 * legibility:
 *   • step 3  #E8EDFF — fills (primary button, active chip, sticker backing)
 *   • step 9  #6C8EFF — vivid marks only (icons, unread dot). 3.0:1 on white,
 *                       which is fine for graphics and NOT enough for text.
 *   • step 11 #33409E — every piece of brand-colored *text*. 7.6:1 on the tint,
 *                       8.9:1 on white.
 * So `$buttonPrimaryBg` maps to step 3 and `$textOnPrimary` to step 11 — the
 * light-fill / dark-label inversion, not the usual solid-fill / white-label.
 *
 * Dosage is deliberately minimal: the brand appears on the primary button, the
 * active chip, links and the unread dot. Nothing else. Two colors sit outside
 * the brand on purpose — the coral notification badge (`$danger`) and the
 * yellow favorite star (`$accentYellow`) — because each says exactly one thing
 * and shouldn't shift when the brand does.
 *
 * The color in this app comes from the recipe photography and from motion, not
 * from the surfaces.
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

// Primary — periwinkle
const primaryLight: Scale12 = [
  '#F7F9FF', // 1  app bg tint
  '#EEF2FF', // 2
  '#E8EDFF', // 3  tint — primary BUTTON FILL, active chip, sticker backing
  '#CFD9FC', // 4  the hairline that gives the pale button a readable edge
  '#B3C3F9', // 5
  '#93A9F5', // 6  subtle border
  '#7C95F2', // 7  border
  '#5F7CE8', // 8  strong border
  '#6C8EFF', // 9  vivid anchor — MARKS ONLY (icons, unread dot). 3.0:1 on white
  '#4A5ED0', // 10 the solid fill that carries WHITE text — 5.5:1. Step 9 is
             //    only 3.0:1 and fails as a button background.
  '#33409E', // 11 every brand-colored TEXT. 7.6:1 on tint, 8.9:1 on white
  '#1B2360', // 12 high-contrast text
];

// Secondary — ink. Neutral dark solids; deliberately not a second brand hue,
// so nothing competes with the rose pair.
const secondaryLight: Scale12 = [
  '#F7F7F8', // 1
  '#EFEFF1', // 2
  '#E2E2E6', // 3  component bg
  '#D0D0D6', // 4
  '#B5B5BE', // 5
  '#94949F', // 6  subtle border
  '#71717C', // 7  border
  '#4E4E58', // 8  strong border
  '#1C1C24', // 9  solid ink
  '#2E2E38', // 10 solid hover
  '#43434D', // 11 low-contrast text
  '#0C0C11', // 12 high-contrast text
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

// Dark mode keeps the same three jobs: step 3 is the fill (now a deep navy),
// step 9 stays the vivid anchor, step 11 becomes the light text on the fill.
const primaryDark: Scale12 = [
  '#0F1220',
  '#141829',
  '#1E2440', // 3  button fill on dark
  '#2A3358',
  '#37426F',
  '#455288',
  '#5566A6',
  '#6379C6',
  '#6C8EFF', // 9  vivid anchor — stable across modes
  '#87A3FF',
  '#C3D0FF', // 11 text on the dark fill
  '#EEF2FF',
];

const secondaryDark: Scale12 = [
  '#0F0F13',
  '#16161B',
  '#1F1F26',
  '#282830',
  '#33333C',
  '#41414B',
  '#53535E',
  '#6C6C78',
  '#F2F2F6', // 9 — inverted: the ink solid becomes bone on dark
  '#E2E2E8',
  '#CACAD3',
  '#FFFFFF',
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

  infoBg: '#EEF2FF',
  infoBorder: '#C3CFFA',
  // Sits in the brand's blue family on purpose — "share" is a brand action, and
  // the harsher #2563EB fought the periwinkle beside it.
  infoSolid: '#5B7BF0',
  infoText: '#33409E',
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
  // The universal "soft tint" slot. Deliberately no longer purple — it is the
  // brand's periwinkle tint, kept under the old name so every legacy
  // `$accentLavender` call-site retints without a code change.
  lavender: '#E8EDFF',

  // ── The cool tint ramp ────────────────────────────────────────────────────
  // Four steps spanning teal (172°) to periwinkle (228°).
  //
  // These sit around 85% lightness, not 93%. The first attempt kept all four at
  // a constant 93% and the hues became indistinguishable — four near-whites that
  // read as a rendering fault rather than a decision. A ramp nobody can perceive
  // is worse than a single color, because it looks accidental. Chroma and
  // lightness both have to move for a hue step to register.
  //
  // Used for step-number badges and quick-action blobs. Named for what they are:
  // recycling `peach`/`pink` for blue tints would have been a lie.
  tintTeal: '#C6E7DF',
  tintAqua: '#C8DEF1',
  tintSky: '#CDD7F6',
  tintPeriwinkle: '#D6DCFF',
  /** Cool pink — the ramp's warm-leaning end, still firmly on the cool side.
   *  Distinct from `accentPink` #FFECEF, which is a genuinely warm blush. */
  tintPink: '#FBDFEC',

  // Inks for text and icons sitting on the ramp. Each clears 4.6:1 on its own
  // tint, so a label never has to fall back to near-black and go muddy.
  tintTealInk: '#0B6B5F',
  tintPinkInk: '#9B2C60',

  peach: '#FFF2E6',
  pink: '#FFECEF',
  mint: '#E6F7F1',
  lime: '#EEF2FF',
  // Still named "lime" for the steppers and RecipeTip that consume them; both
  // are periwinkle now so those call-sites retint without a code change.
  // `limeBright` is a soft fill; `limeVivid` is a mid-tone that carries the
  // deep brand label at 4.5:1 and reads as a 2px connector line on white.
  limeBright: '#E8EDFF',
  limeVivid: '#CFD9FC',
  teal: '#14B8A6',
  blue: '#2563EB',
  coral: '#FF4D6D',
  // The favorite star. Deliberately outside the brand family — yellow reads as
  // "favorite" with no learning, and staying off-brand means it never has to
  // move when the brand does.
  yellow: '#F8C80E',
  orange: '#FFB74D',
  seafoam: '#4DB6AC',
  // Vivid on purpose — this one is confetti, not a surface tint.
  green: '#34C759',
  indigo: '#7986CB',
  purple: '#BA68C8',
  brown: '#A1887F',
  blueGray: '#90A4AE',
  charcoal: '#454344',
  cloud: '#F5F5F5',
} as const;

// Slightly deepened so the same hues read on dark surfaces.
const accentsDark = {
  lavender: '#1E2440',

  tintTeal: '#1B3A34',
  tintAqua: '#1C2F3E',
  tintSky: '#232C4A',
  tintPeriwinkle: '#2A3159',
  tintPink: '#3A1E2C',
  tintTealInk: '#8FDCCD',
  tintPinkInk: '#F0A8C7',

  peach: '#3D3322',
  pink: '#3A222A',
  mint: '#143029',
  lime: '#141829',
  limeBright: '#1E2440',
  limeVivid: '#2A3358',
  teal: '#0F8C7F',
  blue: '#3B74E8',
  coral: '#E84566',
  yellow: '#F8C80E',
  orange: '#E6A645',
  seafoam: '#3F9E95',
  green: '#6FB073',
  indigo: '#6B78B8',
  purple: '#A65BB3',
  brown: '#8E776F',
  blueGray: '#7E909C',
  charcoal: '#454344',
  cloud: '#F5F5F5',
} as const;

// ─── Surfaces ───────────────────────────────────────────────────────────────

const surfacesLight = {
  background: '#FFFFFF', // app canvas — pure white; #FCFCFC read as faintly grey
  surface: '#FFFFFF', // cards, inputs, sheets, nav bar
  searchBar: '#F5F7F8', // search field fill (feed + search page)
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
  searchBar: '#1B2230', // search field fill (feed + search page)
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
