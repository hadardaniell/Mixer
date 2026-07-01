import { Platform, TextInput, type TextInputProps } from 'react-native';
import { useTheme } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

const INPUT_FONT = Platform.select({ web: 'Rubik', default: 'Rubik_400Regular' });

type Props = TextInputProps & { multiline?: boolean };

/**
 * The bordered, rounded text field used across the manual wizard — Rubik font,
 * RTL-aware alignment, theme colors. A thin wrapper over RN TextInput so every
 * field in the flow looks identical.
 */
export function ManualTextInput({ multiline, style, ...rest }: Props) {
  const theme = useTheme();
  const isRtl = useIsRtl();
  return (
    <TextInput
      {...rest}
      multiline={multiline}
      placeholderTextColor={theme.textMuted?.val as string}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[
        {
          backgroundColor: theme.surface?.val as string,
          borderWidth: 1,
          borderColor: theme.border?.val as string,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          // Let the field shrink inside a flex row instead of overflowing.
          minWidth: 0,
          minHeight: multiline ? 96 : 50,
          fontFamily: INPUT_FONT,
          fontSize: 15,
          color: theme.text?.val as string,
          textAlign: isRtl ? 'right' : 'left',
        },
        Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
        style,
      ]}
    />
  );
}
