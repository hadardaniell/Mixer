import { useTranslation } from 'react-i18next';
import { Text, XStack } from 'tamagui';

export type FavoritesFilter = 'all' | 'recipes' | 'books';

const FILTERS: FavoritesFilter[] = ['all', 'recipes', 'books'];

interface ProfileFilterChipsProps {
  value: FavoritesFilter;
  onChange: (filter: FavoritesFilter) => void;
}

/** Pill filter row shown under the Favorites tab: All / Recipes / Books. */
export function ProfileFilterChips({ value, onChange }: ProfileFilterChipsProps) {
  const { t } = useTranslation();

  return (
    <XStack gap="$2" justifyContent="center">
      {FILTERS.map((key) => {
        const selected = key === value;
        return (
          <XStack
            key={key}
            onPress={() => onChange(key)}
            paddingHorizontal={14}
            paddingVertical={6}
            borderRadius={999}
            borderWidth={1}
            borderColor={selected ? '$accentLavender' : '$border'}
            backgroundColor={selected ? '$accentLavender' : '$surface'}
            pressStyle={{ opacity: 0.85 }}
          >
            <Text fontSize={14} fontWeight="600" color={selected ? '$primary' : '$text'}>
              {t(`profile.filters.${key}`)}
            </Text>
          </XStack>
        );
      })}
    </XStack>
  );
}
