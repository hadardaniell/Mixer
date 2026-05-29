import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { Home, Plus, Search, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

interface CustomTabBarProps extends BottomTabBarProps {
  onAddPress: () => void;
}

export function TabBar({ state, navigation, onAddPress }: CustomTabBarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;

  const active = theme.primary.val;
  const inactive = theme.textMuted.val;
  const pill = theme.primarySubtle.val;

  const goTab = (routeName: string) => {
    if (routeName === current) return;
    navigation.navigate(routeName);
  };

  return (
    <YStack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      paddingBottom={insets.bottom > 0 ? insets.bottom : 12}
      backgroundColor="$surface"
      borderTopWidth={1}
      borderTopColor="$border"
      shadowColor="black"
      shadowOpacity={0.06}
      shadowOffset={{ width: 0, height: -6 }}
      shadowRadius={16}
      elevation={8}
    >
      <XStack
        height={64}
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$5"
        flexDirection="row"
        style={{ direction: 'ltr' } as never}
      >
        {/* Left cluster */}
        <XStack flex={1} alignItems="center" justifyContent="space-around">
          <TabItem
            label={t('nav.home')}
            active={current === 'home'}
            activeColor={active}
            inactiveColor={inactive}
            pillColor={pill}
            onPress={() => goTab('home')}
          >
            {(color) => <Home size={24} color={color} />}
          </TabItem>
          <TabItem
            label={t('nav.search')}
            active={false}
            activeColor={active}
            inactiveColor={inactive}
            pillColor={pill}
            onPress={() => router.push('/search')}
          >
            {(color) => <Search size={24} color={color} />}
          </TabItem>
        </XStack>

        {/* Center FAB */}
        <Pressable onPress={onAddPress} accessibilityRole="button">
          <YStack
            width={60}
            height={60}
            marginTop={-28}
            borderRadius={30}
            backgroundColor="$fab"
            alignItems="center"
            justifyContent="center"
            borderWidth={4}
            borderColor="$surface"
            shadowColor="black"
            shadowOpacity={0.18}
            shadowOffset={{ width: 0, height: 6 }}
            shadowRadius={12}
            elevation={6}
          >
            <Plus size={30} color={theme.fabText.val} />
          </YStack>
        </Pressable>

        {/* Right cluster */}
        <XStack flex={1} alignItems="center" justifyContent="space-around">
          <TabItem
            label={t('nav.profile')}
            active={current === 'profile'}
            activeColor={active}
            inactiveColor={inactive}
            pillColor={pill}
            onPress={() => goTab('profile')}
          >
            {(color) => <User size={24} color={color} />}
          </TabItem>
          {/* Spacer keeps the FAB visually centered against the left cluster */}
          <YStack width={48} />
        </XStack>
      </XStack>
    </YStack>
  );
}

function TabItem({
  label,
  active,
  activeColor,
  inactiveColor,
  pillColor,
  onPress,
  children,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  inactiveColor: string;
  pillColor: string;
  onPress: () => void;
  children: (color: string) => React.ReactNode;
}) {
  const color = active ? activeColor : inactiveColor;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <YStack alignItems="center" gap={2} width={56}>
        <YStack
          width={48}
          height={32}
          borderRadius={16}
          alignItems="center"
          justifyContent="center"
          backgroundColor={active ? pillColor : 'transparent'}
        >
          {children(color)}
        </YStack>
        <Text fontSize={11} fontWeight={active ? '700' : '500'} color={color}>
          {label}
        </Text>
      </YStack>
    </Pressable>
  );
}
