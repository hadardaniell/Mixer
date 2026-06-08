import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Plus, User } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, XStack, YStack } from 'tamagui';

type CustomTabBarProps = BottomTabBarProps;

export function TabBar({ state, navigation }: CustomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;

  // Icons are dark ink whether active or not; the active state is shown via the
  // lavender circle behind it plus a small violet dot underneath.
  const iconColor = theme.text.val;
  const dotColor = theme.primary.val;
  const pill = theme.primarySubtle.val;

  const goTab = (routeName: string) => {
    if (routeName === current) return;
    navigation.navigate(routeName);
  };

  return (
    <YStack
      position="absolute"
      bottom={insets.bottom > 0 ? insets.bottom + 8 : 16}
      left={0}
      right={0}
      alignItems="center"
      paddingHorizontal={16}
    >
      <YStack width="100%" maxWidth={440}>
        {/* Solid surface background — its own layer so the icons and the FAB on
            top stay crisp regardless of the bar's styling. */}
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          borderRadius={32}
          backgroundColor="$surface"
          shadowColor="black"
          shadowOpacity={0.12}
          shadowOffset={{ width: 0, height: 8 }}
          shadowRadius={24}
          elevation={12}
        />

        <XStack
          height={64}
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$5"
          flexDirection="row"
          style={{ direction: 'ltr' } as never}
        >
          {/* Home */}
          <XStack flex={1} alignItems="center" justifyContent="space-around">
            <TabItem
              active={current === 'home'}
              iconColor={iconColor}
              pillColor={pill}
              dotColor={dotColor}
              onPress={() => goTab('home')}
            >
              {(color) => <Home size={24} color={color} />}
            </TabItem>
          </XStack>

          {/* Center FAB — violet, navigates to the create-recipe screen. */}
          <Pressable onPress={() => goTab('new-recipe')} accessibilityRole="button">
            <YStack
              width={48}
              height={48}
              borderRadius={24}
              backgroundColor="$primary"
              alignItems="center"
              justifyContent="center"
              shadowColor="$primary"
              shadowOpacity={0.3}
              shadowOffset={{ width: 0, height: 6 }}
              shadowRadius={12}
              elevation={6}
            >
              <Plus size={22} color={theme.textOnPrimary.val} />
            </YStack>
          </Pressable>

          {/* Profile */}
          <XStack flex={1} alignItems="center" justifyContent="space-around">
            <TabItem
              active={current === 'profile'}
              iconColor={iconColor}
              pillColor={pill}
              dotColor={dotColor}
              onPress={() => goTab('profile')}
            >
              {(color) => <User size={24} color={color} />}
            </TabItem>
          </XStack>
        </XStack>
      </YStack>
    </YStack>
  );
}

function TabItem({
  active,
  iconColor,
  pillColor,
  dotColor,
  onPress,
  children,
}: {
  active: boolean;
  iconColor: string;
  pillColor: string;
  dotColor: string;
  onPress: () => void;
  children: (color: string) => React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {/* The icon circle is the laid-out element, so its center lines up with
          the FAB's center. The active dot is absolutely positioned below and
          doesn't affect vertical alignment. */}
      <YStack
        width={44}
        height={44}
        borderRadius={999}
        alignItems="center"
        justifyContent="center"
        backgroundColor={active ? pillColor : 'transparent'}
      >
        {children(iconColor)}
        {active ? (
          <YStack
            position="absolute"
            bottom={-9}
            width={6}
            height={6}
            borderRadius={999}
            backgroundColor={dotColor}
          />
        ) : null}
      </YStack>
    </Pressable>
  );
}
