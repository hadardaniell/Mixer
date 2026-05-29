/**
 * Material-style outlined input.
 *
 * - White (theme `$inputBg`) fill, mint (theme `$inputBorder`) outlined border.
 * - Floating label: sits centered when empty + blurred; animates up to sit on
 *   the top border (with bg masking the line) when focused or filled.
 * - Focus → border thickens to 2px and switches to `$inputBorderFocus`.
 * - Error → border becomes `$danger`, label tinted `$dangerText`.
 *
 * Pure RN Animated (no Reanimated needed). Theme tokens read via Tamagui
 * `useTheme()` so the visual stays in sync with palette changes.
 */

import { forwardRef, type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextStyle,
  type TextInputProps,
  type ViewStyle,
  View,
} from 'react-native';
import { useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';

type Props = Omit<TextInputProps, 'placeholder'> & {
  label: string;
  error?: boolean;
  endAdornment?: ReactNode;
  floatingLabel?: boolean;
  fontFamily?: TextStyle['fontFamily'];
  useSystemFont?: boolean;
};

const HEIGHT = 56;
const RADIUS = 8;
const PAD_X = 14;
const LABEL_X = 12;
const LABEL_FLOAT_SCALE = 0.75;
const ANIM_MS = 160;

export const OutlinedInput = forwardRef<TextInput, Props>(function OutlinedInput(
  {
    label,
    error,
    value,
    onFocus,
    onBlur,
    style,
    endAdornment,
    floatingLabel = true,
    fontFamily,
    useSystemFont = false,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const [focused, setFocused] = useState(false);
  const hasValue = !!value && String(value).length > 0;
  const floated = floatingLabel && (focused || hasValue);
  const isRtl = i18n.dir() === 'rtl';

  const anim = useRef(new Animated.Value(floated ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: floated ? 1 : 0,
      duration: ANIM_MS,
      useNativeDriver: false, // we animate translate + scale + color
    }).start();
  }, [floated, anim]);

  // Resolve theme colors (Tamagui returns Variable objects with .val).
  const flattenedWrapperStyle = StyleSheet.flatten(style as StyleProp<ViewStyle>);
  // Honor a caller-provided radius so the inner input matches the wrapper's
  // rounded corners (otherwise the input bg paints over the border curve).
  const radius = (flattenedWrapperStyle?.borderRadius as number | undefined) ?? RADIUS;
  const wrapperBg = flattenedWrapperStyle?.backgroundColor;
  const bg =
    typeof wrapperBg === 'string' && wrapperBg.length > 0
      ? wrapperBg
      : ((theme.inputBg?.val as string) ?? '#FFFFFF');
  const borderIdle = (theme.inputBorder?.val as string) ?? '#CCCCCC';
  const borderFocus = (theme.inputBorderFocus?.val as string) ?? '#3D7FB8';
  const dangerCol = (theme.danger?.val as string) ?? '#C8453B';
  const textCol = (theme.gray12?.val as string) ?? '#111111';
  const labelIdle = (theme.gray10?.val as string) ?? '#888888';
  const resolvedFontFamily = useSystemFont ? undefined : (fontFamily ?? 'Heebo');

  const borderColor = error ? dangerCol : focused ? borderFocus : borderIdle;
  const borderWidth = focused || error ? 2 : 1;
  const webAutofillBg =
    Platform.OS === 'web'
      ? ({
          backgroundColor: bg,
          boxShadow: `0 0 0 1000px ${bg} inset`,
          WebkitBoxShadow: `0 0 0 1000px ${bg} inset`,
          transition: 'background-color 9999s ease-out 0s',
        } as never)
      : null;

  // Label animation: translateY from center → above top border; font scale shrinks.
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(HEIGHT / 2)],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, LABEL_FLOAT_SCALE],
  });
  // Origin matters for RTL: scale from start so the floated label aligns left/right.
  const transformOriginStyle = isRtl
    ? { transformOrigin: 'right center' as const }
    : { transformOrigin: 'left center' as const };

  return (
    <Pressable
      onPress={() => {
        // Tapping the wrapper focuses the input (especially useful when tapping the label).
        if (ref && typeof ref !== 'function' && ref.current) ref.current.focus();
      }}
      style={[
        styles.wrapper,
        {
          borderColor,
          borderWidth,
          backgroundColor: bg,
          borderRadius: radius,
          direction: isRtl ? 'rtl' : 'ltr',
        } as never,
        style,
      ]}
    >
      <TextInput
        ref={ref}
        {...rest}
        value={value}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholder={floatingLabel ? '' : label}
        placeholderTextColor={labelIdle}
        style={[
          styles.input,
          {
            color: textCol,
            backgroundColor: bg,
            borderRadius: radius,
            direction: isRtl ? 'rtl' : 'ltr',
            fontFamily: resolvedFontFamily,
            textAlign: isRtl ? 'right' : 'left',
            // Compensate when wrapper border thickens, so content doesn't jump.
            paddingLeft: (isRtl && endAdornment ? 52 : PAD_X) - (borderWidth - 1),
            paddingRight: (!isRtl && endAdornment ? 52 : PAD_X) - (borderWidth - 1),
          },
          webAutofillBg,
        ]}
      />

      {endAdornment ? (
        <View
          style={[
            styles.adornment,
            isRtl ? { left: 14 } : { right: 14 },
          ]}
        >
          {endAdornment}
        </View>
      ) : null}

      {floatingLabel ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.labelWrap,
            transformOriginStyle,
            {
              transform: [{ translateY }, { scale }],
              // When floated, give the label a bg chip to mask the border line behind it.
              backgroundColor: floated ? bg : 'transparent',
              paddingHorizontal: floated ? 4 : 0,
              // Align label start for LTR / end for RTL.
              ...(isRtl
                ? { right: LABEL_X, left: undefined }
                : { left: LABEL_X, right: undefined }),
            },
          ]}
        >
          <Animated.Text
            style={{
              fontSize: 16,
              fontFamily: resolvedFontFamily,
              color: error ? dangerCol : focused ? borderFocus : labelIdle,
              includeFontPadding: false,
            }}
          >
            {label}
          </Animated.Text>
        </Animated.View>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    height: HEIGHT,
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'visible',
    position: 'relative',
    width: '100%',
    ...Platform.select({ web: { boxSizing: 'border-box' as never } }),
  },
  input: {
    height: HEIGHT,
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
    ...Platform.select({ web: { outlineStyle: 'none' as never } }),
  },
  adornment: {
    alignItems: 'center',
    height: HEIGHT,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 32,
  },
  labelWrap: {
    position: 'absolute',
    top: HEIGHT / 2 - 10,
  },
});
