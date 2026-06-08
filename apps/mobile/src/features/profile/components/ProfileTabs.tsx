import { Book, BookOpen, Star, type LucideIcon } from 'lucide-react-native';
import { useTheme, View, XStack, YStack } from 'tamagui';

export type ProfileTab = 'favorites' | 'books' | 'recipes';

const TABS: { key: ProfileTab; icon: LucideIcon }[] = [
  { key: 'favorites', icon: Star },
  { key: 'books', icon: BookOpen },
  { key: 'recipes', icon: Book },
];

interface ProfileTabsProps {
  value: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

/** Icon-only 3-way control: Favorites / Books / Recipes. Active = primary + underline. */
export function ProfileTabs({ value, onChange }: ProfileTabsProps) {
  const theme = useTheme();
  const primary = theme.primary?.val as string;
  const muted = theme.textMuted?.val as string;

  return (
    <XStack>
      {TABS.map(({ key, icon: Icon }) => {
        const selected = key === value;
        return (
          <YStack
            key={key}
            flex={1}
            onPress={() => onChange(key)}
            alignItems="center"
            gap="$2"
            paddingVertical="$2"
            pressStyle={{ opacity: 0.85 }}
          >
            <Icon size={24} color={selected ? primary : muted} />
            <View
              height={2}
              width={24}
              borderRadius={999}
              backgroundColor={selected ? '$primary' : 'transparent'}
            />
          </YStack>
        );
      })}
    </XStack>
  );
}
