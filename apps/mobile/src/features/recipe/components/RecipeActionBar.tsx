import { Bookmark, Check, Copy, Share2, type LucideIcon } from 'lucide-react-native';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, View, XStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

interface RecipeActionBarProps {
  onShare: () => void;
  onSaveToBook: () => void;
  onCopy: () => void;
  /** Briefly true after a copy — swaps the copy icon for a green check. */
  copied: boolean;
}

/**
 * The white card of secondary actions under the CTA: share, save-to-book and
 * copy-as-text, split by thin dividers.
 */
export function RecipeActionBar({ onShare, onSaveToBook, onCopy, copied }: RecipeActionBarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;
  const rowDirection = isRtl ? 'row-reverse' : 'row';

  const items: Array<{
    key: string;
    label: string;
    Icon: LucideIcon;
    iconColor?: string;
    onPress: () => void;
  }> = [
    { key: 'share', label: t('recipe.actions.share'), Icon: Share2, onPress: onShare },
    {
      key: 'saveToBook',
      label: t('recipe.actions.saveToBook'),
      Icon: Bookmark,
      onPress: onSaveToBook,
    },
    {
      key: 'copy',
      label: t('recipe.actions.copy'),
      // The check *is* the confirmation — there's no toast to go with it.
      Icon: copied ? Check : Copy,
      iconColor: copied ? (theme.success?.val as string) : undefined,
      onPress: onCopy,
    },
  ];

  return (
    <XStack
      backgroundColor="$surface"
      borderRadius={18}
      paddingVertical="$3"
      alignItems="center"
      shadowColor="black"
      shadowOpacity={0.28}
      shadowRadius={14}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={10}
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
            <item.Icon size={18} color={item.iconColor ?? ink} />
          </XStack>
        </Fragment>
      ))}
    </XStack>
  );
}
