import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, XStack } from 'tamagui';

interface SearchInputProps {
  onPress: () => void;
  placeholder?: string;
}

export function SearchInput({ onPress, placeholder }: SearchInputProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const label = placeholder ?? t('home.searchPlaceholder');
  const muted = theme.textMuted?.val as string;

  return (
    <Pressable onPress={onPress} accessibilityRole="search" style={{ width: '100%' }}>
      <XStack
        width="100%"
        alignItems="center"
        gap="$3"
        paddingHorizontal="$4"
        height={48}
        borderRadius={28}
        backgroundColor="$surface"
        shadowColor="black"
        shadowOpacity={0.1}
        shadowRadius={24}
        shadowOffset={{ width: 0, height: 8 }}
        elevation={6}
        pressStyle={{ backgroundColor: '$bgSubtle' }}
      >
        {/* <Search size={20} color={muted} /> */}
        <Text flex={1} color="$textMuted" fontSize={15} numberOfLines={1}>
          {label}
        </Text>
      </XStack>
    </Pressable>
  );
}
