import { config as baseConfig } from '@tamagui/config/v3';
import { Platform } from 'react-native';
import { createFont, createTamagui } from 'tamagui';

import { themes } from './themes';
import { tokens } from './tokens';

// ─── Rubik (app-wide font) ───────────────────────────────────────────────────
// Native picks a per-weight family via `face`; web uses the `Rubik` family
// declared through @font-face in app/_layout.tsx. Only 400/500/700 ttf weights
// are bundled, so 600 maps to Medium.
const rubikFace = {
  400: { normal: 'Rubik_400Regular' },
  500: { normal: 'Rubik_500Medium' },
  600: { normal: 'Rubik_500Medium' },
  700: { normal: 'Rubik_700Bold' },
};

const rubikFamily = Platform.select({
  web: 'Rubik, system-ui, -apple-system, sans-serif',
  default: 'Rubik_400Regular',
}) as string;

const makeRubik = (base: typeof baseConfig.fonts.body) =>
  createFont({
    family: rubikFamily,
    size: base.size,
    lineHeight: base.lineHeight,
    weight: base.weight,
    letterSpacing: base.letterSpacing,
    face: rubikFace,
  });

const fonts = {
  ...baseConfig.fonts,
  body: makeRubik(baseConfig.fonts.body),
  heading: makeRubik(baseConfig.fonts.heading),
};

export const tamaguiConfig = createTamagui({
  ...baseConfig,
  fonts,
  tokens,
  themes: {
    ...baseConfig.themes,
    light: { ...baseConfig.themes.light, ...themes.light },
    dark: { ...baseConfig.themes.dark, ...themes.dark },
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
