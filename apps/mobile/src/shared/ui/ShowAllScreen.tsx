import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList, type ListRenderItem, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { isRTL } from '@/shared/lib/i18n';
import { useLanguage } from '@/features/settings/hooks/useLanguage';

interface ShowAllScreenProps<T> {
  title: string;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
  /** Items per grid row. Defaults to 2 (cards). */
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
  numColumns = 2,
  emptyText,
}: ShowAllScreenProps<T>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRtl = isRTL(language);
  const ink = theme.text?.val as string;

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
        <Text flex={1} color="$text" fontSize={20} fontWeight="700">
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
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={numColumns}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 14 }}
          columnWrapperStyle={numColumns > 1 ? { gap: 14, justifyContent: 'flex-start' } : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </YStack>
  );
}
