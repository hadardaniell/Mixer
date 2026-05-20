import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Plus, User } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { XStack, YStack } from 'tamagui';

interface CustomTabBarProps extends BottomTabBarProps {
  onAddPress: () => void;
}

export function TabBar({ state, navigation, onAddPress }: CustomTabBarProps) {
  const current = state.routes[state.index]?.name;

  const go = (routeName: string) => {
    if (routeName === current) return;
    navigation.navigate(routeName);
  };

  return (
    <XStack
      position="absolute"
      bottom="$4"
      left="$6"
      right="$6"
      height={64}
      borderRadius={32}
      backgroundColor="white"
      alignItems="center"
      justifyContent="space-around"
      shadowColor="black"
      shadowOpacity={0.15}
      shadowOffset={{ width: 0, height: 4 }}
      shadowRadius={12}
      elevation={6}
    >
      <TabIcon active={current === 'home'} onPress={() => go('home')}>
        <Home size={24} color={current === 'home' ? '#111' : '#888'} />
      </TabIcon>

      <Pressable onPress={onAddPress}>
        <YStack
          width={56}
          height={56}
          borderRadius={28}
          backgroundColor="#f5d04e"
          alignItems="center"
          justifyContent="center"
        >
          <Plus size={28} color="#111" />
        </YStack>
      </Pressable>

      <TabIcon active={current === 'profile'} onPress={() => go('profile')}>
        <User size={24} color={current === 'profile' ? '#111' : '#888'} />
      </TabIcon>
    </XStack>
  );
}

function TabIcon({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress}>
      <YStack
        width={48}
        height={48}
        borderRadius={24}
        alignItems="center"
        justifyContent="center"
        backgroundColor={active ? '$gray3' : 'transparent'}
      >
        {children}
      </YStack>
    </Pressable>
  );
}
