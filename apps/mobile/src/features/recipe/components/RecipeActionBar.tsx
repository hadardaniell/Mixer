//apps/mobile/src/features/recipe/components/RecipeActionBar.tsx
import { Bookmark, Check, Copy, CopyPlus, Share2, Languages, type LucideIcon } from 'lucide-react-native';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner, Text, useTheme, View, XStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

interface RecipeActionBarProps {
  /** Owners share; everyone else gets "save a copy" in the same slot, since a
   *  recipe that isn't yours can't be shared. */
  isOwner: boolean;
  onShare: () => void;
  onSaveAs: () => void;
  savingAs?: boolean;
  onSaveToBook: () => void;
  onCopy: () => void;
  /** Briefly true after a copy — swaps the copy icon for a green check. */
  copied: boolean;
  onTranslate: () => void;
  isTranslated: boolean;
  isTranslating?: boolean;
}

/**
 * The white card of secondary actions under the CTA: the first slot is share
 * (owner) or save-a-copy (everyone else), then save-to-book and copy-as-text,
 * split by thin dividers.
 */
export function RecipeActionBar({
  isOwner,
  onShare,
  onSaveAs,
  savingAs,
  onSaveToBook,
  onCopy,
  copied,
  onTranslate,
  isTranslated,
  isTranslating,
}: RecipeActionBarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;
  const rowDirection = isRtl ? 'row-reverse' : 'row';

  const firstItem = isOwner
    ? { key: 'share', label: t('recipe.actions.share'), Icon: Share2, onPress: onShare }
    : {
        key: 'saveAs',
        label: t('recipe.actions.saveAs'),
        Icon: CopyPlus,
        onPress: onSaveAs,
        loading: savingAs,
      };

  const items: Array<{
    key: string;
    label: string;
    Icon: LucideIcon;
    iconColor?: string;
    loading?: boolean;
    onPress: () => void;
  }> = [
    firstItem,
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
    {
      key: 'translate',
      label: isTranslated ? t('recipe.actions.showOriginal') : t('recipe.actions.translate'),
      Icon: Languages,
      loading: isTranslating,
      onPress: onTranslate,
    }
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
            onPress={item.loading ? undefined : item.onPress}
            accessibilityRole="button"
            alignItems="center"
            justifyContent="center"
            gap={6}
            paddingVertical="$1"
            flexDirection={rowDirection}
            opacity={item.loading ? 0.5 : 1}
            pressStyle={{ opacity: 0.6 }}
          >
            <Text fontSize={13} fontWeight="600" color="$text">
              {item.label}
            </Text>
            {item.loading ? (
              <Spinner size="small" color={ink} />
            ) : (
              <item.Icon size={18} color={item.iconColor ?? ink} />
            )}
          </XStack>
        </Fragment>
      ))}
    </XStack>
  );
}
