import { Platform, type TextStyle } from 'react-native';

export const AUTH_FONT_FAMILY: TextStyle['fontFamily'] = Platform.select({
  web: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  default: undefined,
});

export const AUTH_USES_SYSTEM_FONT = Platform.OS !== 'web';
