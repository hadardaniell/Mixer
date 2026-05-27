import { config as baseConfig } from '@tamagui/config/v3';
import { createTamagui } from 'tamagui';

import { themes } from './themes';
import { tokens } from './tokens';

export const tamaguiConfig = createTamagui({
  ...baseConfig,
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
