import { Children, type ReactNode } from 'react';
import { Text, View, YStack } from 'tamagui';

interface SettingsSectionProps {
  title?: string;
  children: ReactNode;
}

/**
 * A titled group of `SettingsRow`s on one rounded `$surface` card, hairline
 * dividers between rows (Instagram's settings anatomy).
 */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <YStack gap="$2">
      {title ? (
        <Text fontSize={17} fontWeight="700" color="$text" paddingHorizontal="$2">
          {title}
        </Text>
      ) : null}

      <YStack
        backgroundColor="$surface"
        borderRadius={18}
        overflow="hidden"
        shadowColor="black"
        shadowOpacity={0.06}
        shadowRadius={14}
        shadowOffset={{ width: 0, height: 6 }}
        elevation={2}
      >
        {rows.map((row, i) => (
          <YStack key={i}>
            {i > 0 ? <View height={1} marginStart={64} backgroundColor="$border" /> : null}
            {row}
          </YStack>
        ))}
      </YStack>
    </YStack>
  );
}
