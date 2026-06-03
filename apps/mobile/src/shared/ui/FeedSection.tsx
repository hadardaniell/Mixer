import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, type ListRenderItem, Pressable } from 'react-native';
import { useTheme, Text, XStack, YStack } from 'tamagui';

import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { isRTL } from '@/shared/lib/i18n';

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
  const theme = useTheme();
  const { language } = useLanguage();
  const isRtl = isRTL(language);
  const primary = theme.primary?.val as string;
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  if (data.length === 0 && !emptyText) return null;

  return (
    <YStack gap="$2">
      <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$4">
        <Text fontSize={17} fontWeight="700" color="$text">
          {title}
        </Text>
        {onSeeMore ? (
          <Pressable onPress={onSeeMore} accessibilityRole="button" hitSlop={8}>
            <XStack alignItems="center" gap={2}>
              <Text fontSize={13} color="$primary" fontWeight="600">
                {t('home.seeMore')}
              </Text>
              <Chevron size={16} color={primary} />
            </XStack>
          </Pressable>
        ) : null}
      </XStack>

      {data.length === 0 ? (
        <YStack paddingHorizontal="$4" paddingVertical="$3">
          <Text color="$textMuted" fontSize={13}>
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
