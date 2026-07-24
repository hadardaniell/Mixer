import { Search, X } from 'lucide-react-native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, TextInput } from 'react-native';
import { Text, useTheme, XStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

const INPUT_FONT = Platform.select({ web: 'Rubik', default: 'Rubik_400Regular' });

interface HomeSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Whether the screen is in search mode. */
  active: boolean;
  /** Fired when the field gains focus — the parent switches to search mode. */
  onActivate: () => void;
  /** Fired by the trailing "cancel" affordance — the parent exits search mode. */
  onCancel: () => void;
}

/**
 * The home search bar. In feed mode it reads as a rounded placeholder field;
 * focusing it activates search mode (the parent swaps the body for results).
 */
export function HomeSearchBar({
  value,
  onChangeText,
  active,
  onActivate,
  onCancel,
}: HomeSearchBarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const inputRef = useRef<TextInput>(null);
  const muted = theme.textMuted?.val as string;
  const ink = theme.text?.val as string;

  const cancel = () => {
    inputRef.current?.blur();
    onCancel();
  };

  return (
    <XStack alignItems="center" gap="$2" width="100%">
      <XStack
        flex={1}
        alignItems="center"
        gap="$3"
        paddingHorizontal="$4"
        height={48}
        borderRadius={28}
        backgroundColor="$searchBarBg"
      >
        <Search size={20} color={muted} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={onActivate}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor={muted}
          returnKeyType="search"
          style={{
            flex: 1,
            fontFamily: INPUT_FONT,
            fontSize: 15,
            color: ink,
            paddingVertical: 0,
            textAlign: isRtl ? 'right' : 'left',
            outlineStyle: 'none',
          } as never}
        />
        {active && value.length > 0 ? (
          <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityRole="button">
            <X size={18} color={muted} />
          </Pressable>
        ) : null}
      </XStack>

      {active ? (
        <Pressable onPress={cancel} hitSlop={8} accessibilityRole="button">
          <Text color="$linkText" fontSize={15} fontWeight="700">
            {t('common.cancel')}
          </Text>
        </Pressable>
      ) : null}
    </XStack>
  );
}
