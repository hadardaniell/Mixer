import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, type ListRenderItem } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

interface FeedSectionProps<T> {
  title: string;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
  onSeeMore?: () => void;
  emptyText?: string;
  footer?: ReactNode;
}

export function FeedSection<T>({
  title,
  data,
  keyExtractor,
  renderItem,
  onSeeMore,
  emptyText,
  footer,
}: FeedSectionProps<T>) {
  const { t } = useTranslation();

  if (data.length === 0 && !emptyText) return null;

  return (
    <YStack gap="$2">
      <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$4">
        <Text fontSize="$5" fontWeight="700" color="$gray12">
          {title}
        </Text>
        {onSeeMore ? (
          <Text fontSize="$2" color="$blue10" onPress={onSeeMore}>
            {t('home.seeMore')}
          </Text>
        ) : null}
      </XStack>

      {data.length === 0 ? (
        <YStack paddingHorizontal="$4" paddingVertical="$3">
          <Text color="$gray10" fontSize="$2">
            {emptyText ?? t('home.emptySection')}
          </Text>
        </YStack>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          inverted={false}
        />
      )}

      {footer}
    </YStack>
  );
}
