import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { CirclePlus, User } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, XStack, YStack } from 'tamagui';

import { AddSheet } from './AddSheet';
import { HomeIcon } from './HomeIcon';

type CustomTabBarProps = BottomTabBarProps;

export function TabBar({ state }: CustomTabBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;
  // The FAB reads as "active" while inside a create flow (new recipe or new book).
  const onCreateFlow = current === 'new-recipe' || current === 'books';
  const [addOpen, setAddOpen] = useState(false);

  // Icons are dark ink whether active or not; the active state is shown by
  // filling the icon (outline → solid) rather than any colored background.
  const iconColor = theme.text.val;

  const goTab = (routeName: string) => {
    if (routeName === current) return;
    router.navigate(`/${routeName}` as never);
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
          opacity={0.9}
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
              onPress={() => goTab('home')}
            >
              {(color, fill) => <HomeIcon size={24} color={color} filled={fill !== 'none'} />}
            </TabItem>
          </XStack>

          {/* Center FAB — white circle with the same ink icon as the other tabs.
              Opens the "add" sheet (new recipe / new recipe book). */}
          <Pressable onPress={() => setAddOpen(true)} accessibilityRole="button">
            <YStack
              width={48}
              height={48}
              borderRadius={24}
              backgroundColor="$surface"
              alignItems="center"
              justifyContent="center"
              shadowColor="black"
              shadowOpacity={0.18}
              shadowOffset={{ width: 0, height: 6 }}
              shadowRadius={12}
              elevation={6}
            >
              <CirclePlus
                size={28}
                // Active (on a create flow — new recipe or new book): fill the disc
                // with ink and draw the plus in the surface color so it reads on the
                // fill. Inactive: plain outlined plus-circle.
                color={onCreateFlow ? theme.surface.val : iconColor}
                fill={onCreateFlow ? iconColor : 'none'}
                strokeWidth={1.8}
              />
            </YStack>
          </Pressable>

          {/* Profile */}
          <XStack flex={1} alignItems="center" justifyContent="space-around">
            <TabItem
              active={current === 'profile'}
              iconColor={iconColor}
              onPress={() => goTab('profile')}
            >
              {(color, fill) => <User size={24} color={color} fill={fill} />}
            </TabItem>
          </XStack>
        </XStack>
      </YStack>

      <AddSheet open={addOpen} onOpenChange={setAddOpen} />
    </YStack>
  );
}

function TabItem({
  active,
  iconColor,
  onPress,
  children,
}: {
  active: boolean;
  iconColor: string;
  onPress: () => void;
  /** Receives the stroke color and the fill ('none' when inactive, the ink
   *  color when active) so the icon renders outlined → solid on selection. */
  children: (color: string, fill: string) => React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {/* The icon box is the laid-out element, so its center lines up with the
          FAB's center. */}
      <YStack width={44} height={44} borderRadius={999} alignItems="center" justifyContent="center">
        {children(iconColor, active ? iconColor : 'none')}
      </YStack>
    </Pressable>
  );
}
