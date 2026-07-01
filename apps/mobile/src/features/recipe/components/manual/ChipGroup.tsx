import { Text, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

export interface ChipOption<T extends string | number> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string | number> {
  title: string;
  options: ChipOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  /** Accent token for the selected chip background (default lavender). */
  selectedBg?: string;
  /** Optional trailing node (e.g. a custom "other" input) on the row's end. */
  trailing?: React.ReactNode;
}

/**
 * Labeled row of single-select pill chips. The selected chip fills with a soft
 * accent + keeps dark text; others are surface + 1px border. Used by step 2.
 */
export function ChipGroup<T extends string | number>({
  title,
  options,
  value,
  onChange,
  selectedBg = '$accentLavender',
  trailing,
}: ChipGroupProps<T>) {
  const isRtl = useIsRtl();
  return (
    <YStack gap="$2" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
      <Text color="$text" fontSize={15} fontWeight="700">
        {title}
      </Text>
      <XStack flexWrap="wrap" gap="$2" alignItems="center">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Text
              key={String(opt.value)}
              onPress={() => onChange(opt.value)}
              color="$text"
              fontSize={14}
              fontWeight="600"
              paddingVertical={10}
              paddingHorizontal={18}
              borderRadius={999}
              borderWidth={1}
              borderColor={selected ? 'transparent' : '$border'}
              backgroundColor={selected ? selectedBg : '$surface'}
              pressStyle={{ opacity: 0.85 }}
            >
              {opt.label}
            </Text>
          );
        })}
        {trailing}
      </XStack>
    </YStack>
  );
}
