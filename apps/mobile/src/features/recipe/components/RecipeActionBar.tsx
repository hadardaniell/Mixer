import { Bookmark, Share2, ShoppingCart, type LucideIcon } from 'lucide-react-native';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, View, XStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

interface RecipeActionBarProps {
  onShare: () => void;
  onSaveToBook: () => void;
  onShoppingList: () => void;
}

/**
 * The white card of secondary actions under the CTA: share, save-to-book and
 * add-to-shopping-list, split by thin dividers.
 */
export function RecipeActionBar({ onShare, onSaveToBook, onShoppingList }: RecipeActionBarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;
  const rowDirection = isRtl ? 'row-reverse' : 'row';

  const items: Array<{ key: string; label: string; Icon: LucideIcon; onPress: () => void }> = [
    { key: 'share', label: t('recipe.actions.share'), Icon: Share2, onPress: onShare },
    {
      key: 'saveToBook',
      label: t('recipe.actions.saveToBook'),
      Icon: Bookmark,
      onPress: onSaveToBook,
    },
    {
      key: 'shoppingList',
      label: t('recipe.actions.shoppingList'),
      Icon: ShoppingCart,
      onPress: onShoppingList,
    },
  ];

  return (
    <XStack
      backgroundColor="$surface"
      borderRadius={18}
      paddingVertical="$3"
      alignItems="center"
      shadowColor="black"
      shadowOpacity={0.08}
      shadowRadius={18}
      shadowOffset={{ width: 0, height: 8 }}
      elevation={4}
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 ? <View width={1} height={28} backgroundColor="$border" /> : null}
          <XStack
            flex={1}
            onPress={item.onPress}
            accessibilityRole="button"
            alignItems="center"
            justifyContent="center"
            gap={6}
            paddingVertical="$1"
            flexDirection={rowDirection}
            pressStyle={{ opacity: 0.6 }}
          >
            <Text fontSize={13} fontWeight="600" color="$text">
              {item.label}
            </Text>
            <item.Icon size={18} color={ink} />
          </XStack>
        </Fragment>
      ))}
    </XStack>
  );
}
