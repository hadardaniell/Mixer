import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Text, type TextProps } from 'tamagui';

interface CountUpProps extends Omit<TextProps, 'children'> {
  value: number;
  /** Animation length in ms. */
  duration?: number;
}

/**
 * A number that counts up from zero to `value` when it first appears — a small
 * spark of life on stat rows. Honors "reduce motion" by rendering the final
 * value immediately.
 *
 * Drives the displayed number through React state (Reanimated can't write text
 * content), eased with cubic-out so it decelerates into the final value.
 */
export function CountUp({ value, duration = 900, ...textProps }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced || value <= 0) {
        setDisplay(value);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(value * eased));
        if (p < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, [value, duration]);

  return <Text {...textProps}>{display}</Text>;
}
