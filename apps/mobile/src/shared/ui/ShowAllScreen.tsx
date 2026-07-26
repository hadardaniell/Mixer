import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList, type ListRenderItem, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { isRTL } from '@/shared/lib/i18n';
import { useLanguage } from '@/features/settings/hooks/useLanguage';

const H_PADDING = 16;
const GRID_GAP = 14;
/** Target card width — the column count is whatever fits at roughly this size. */
const TARGET_CARD_WIDTH = 172;

interface ShowAllScreenProps<T> {
  title: string;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
  /** Fix the columns (e.g. 1 for full-width rows). Omit to fit as many cards as
   *  the screen width allows — the cards then fill the row on any device. */
  numColumns?: number;
  /** Custom empty-state copy. */
  emptyText?: string;
}

/**
 * Shared "see all" screen — header with title + back button, then a vertical
 * grid (or list) of items. All four show-all routes funnel through this so
 * there's no per-section duplication.
 */
export function ShowAllScreen<T>({
  title,
  data,
  keyExtractor,
  renderItem,
  numColumns,
  emptyText,
}: ShowAllScreenProps<T>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { language } = useLanguage();
  const isRtl = isRTL(language);
  const ink = theme.text?.val as string;

  // Fit as many cards as the width allows (min 2, capped so cards don't get
  // tiny), unless the caller fixed the column count. Each cell gets an exact
  // width so the row fills edge-to-edge with a consistent gap — no dead space.
  const available = width - H_PADDING * 2;
  const fittedColumns = Math.max(
    2,
    Math.min(5, Math.floor((available + GRID_GAP) / (TARGET_CARD_WIDTH + GRID_GAP))),
  );
  const columns = numColumns ?? fittedColumns;
  const cellWidth = (available - (columns - 1) * GRID_GAP) / columns;

  // Cards fill their cell; full-width rows (columns === 1) render as-is.
  const gridRenderItem: ListRenderItem<T> =
    columns > 1
      ? (info) => <View width={cellWidth}>{renderItem(info)}</View>
      : renderItem;

  return (
    <YStack
      flex={1}
      backgroundColor="$bg"
      paddingTop={insets.top + 8}
      paddingBottom={insets.bottom}
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      <XStack
        width="100%"
        alignItems="center"
        paddingHorizontal="$4"
        paddingVertical="$2"
        gap="$3"
      >
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
          <ArrowRight size={26} color={ink} />
        </Pressable>
        <Text flex={1} color="$textMuted" fontSize={13} fontWeight="700" letterSpacing={1.4}>
          {title}
        </Text>
      </XStack>

      {data.length === 0 ? (
        <View flex={1} alignItems="center" justifyContent="center" padding="$5">
          <Text color="$textMuted" fontSize={15} textAlign="center">
            {emptyText ?? t('home.emptySection')}
          </Text>
        </View>
      ) : (
        <FlatList
          // FlatList can't change numColumns in place — remount when it changes
          // (e.g. web resize / rotation).
          key={`cols-${columns}`}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={gridRenderItem}
          numColumns={columns}
          contentContainerStyle={{
            paddingHorizontal: H_PADDING,
            paddingTop: 8,
            paddingBottom: 24,
            gap: GRID_GAP,
          }}
          columnWrapperStyle={
            columns > 1 ? { gap: GRID_GAP, justifyContent: 'flex-start' } : undefined
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </YStack>
  );
}
