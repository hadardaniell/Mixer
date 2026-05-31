import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';

interface SearchInputProps {
  onPress: () => void;
  placeholder?: string;
}

export function SearchInput({ onPress, placeholder }: SearchInputProps) {
  const { t } = useTranslation();
  const label = placeholder ?? t('home.searchPlaceholder');

  return (
    <Pressable onPress={onPress} accessibilityRole="search">
      <XStack
        alignItems="center"
        gap="$3"
        paddingHorizontal="$4"
        height={48}
        borderRadius={24}
        backgroundColor="white"
        shadowColor="#000"
        shadowOpacity={0.05}
        shadowRadius={18}
        shadowOffset={{ width: 0, height: 8 }}
        elevation={2}
      >
        <Search size={20} color="#9ca3af" />
        <Text flex={1} color="$gray10" fontSize="$3" numberOfLines={1}>
          {label}
        </Text>
      </XStack>
    </Pressable>
  );
}
