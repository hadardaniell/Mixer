import { useTranslation } from 'react-i18next';
import { Text, View, XStack, YStack } from 'tamagui';

export type ProfileTab = 'recipes' | 'books' | 'favorites';

const TABS: ProfileTab[] = ['recipes', 'books', 'favorites'];

interface ProfileTabsProps {
  value: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

/**
 * Labeled 3-way tab bar: Recipes / Books / Favorites. Active tab is ink with a
 * periwinkle underline. Replaces the old icon-only control + the redundant
 * filter chips that used to sit inside the favorites tab.
 */
export function ProfileTabs({ value, onChange }: ProfileTabsProps) {
  const { t } = useTranslation();

  return (
    <XStack borderBottomWidth={1.5} borderColor="$bgSubtle">
      {TABS.map((key) => {
        const selected = key === value;
        return (
          <YStack
            key={key}
            flex={1}
            onPress={() => onChange(key)}
            alignItems="center"
            paddingVertical="$3"
            pressStyle={{ opacity: 0.7 }}
          >
            <Text
              fontSize={14}
              fontWeight="700"
              color={selected ? '$text' : '$textMuted'}
            >
              {t(`profile.tabs.${key}`)}
            </Text>
            <View
              position="absolute"
              bottom={-1.5}
              height={2.5}
              width={40}
              borderRadius={999}
              backgroundColor={selected ? '$primary' : 'transparent'}
            />
          </YStack>
        );
      })}
    </XStack>
  );
}
