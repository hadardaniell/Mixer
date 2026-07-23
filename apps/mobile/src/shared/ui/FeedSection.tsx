import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { type ReactNode, useEffect, useRef, useState } from 'react';
// (StaggerIn below reuses the RN Animated import already present in this file.)
import { useTranslation } from 'react-i18next';
import {
  Animated,
  FlatList,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
} from 'react-native';
import { useTheme, Text, XStack, YStack } from 'tamagui';

import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { isRTL } from '@/shared/lib/i18n';

// Sections are previews — cap the row and let the trailing arrow lead to the
// full "see all" screen.
const MAX_ITEMS = 10;
// How far past the end the user must drag (px) before releasing navigates.
const OVERSCROLL_TRIGGER = 56;

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
  // "See all" stays neutral ink. The brand rose is reserved for the primary
  // button, the active chip and the favorite star — four tinted links on one
  // screen would dilute it until it stops meaning "this is the action".
  const affordance = theme.textMuted?.val as string;
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const items = data.slice(0, MAX_ITEMS);

  // Overscroll-past-the-end → open "see all". The arrow only reveals once the
  // row is scrolled near its end.
  const overscrolled = useRef(false);
  const fired = useRef(false);
  const nearEndRef = useRef(false);
  const [atEnd, setAtEnd] = useState(false);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = contentSize.width - layoutMeasurement.width;
    // Android RTL reports a negative offset that ends at -max; everywhere else
    // (LTR, and iOS/web RTL) it counts 0..max like LTR.
    const androidRtl = isRtl && Platform.OS === 'android';
    const distanceFromEnd = androidRtl ? contentOffset.x + max : max - contentOffset.x;
    overscrolled.current = distanceFromEnd < -OVERSCROLL_TRIGGER;

    const near = distanceFromEnd < 48;
    if (near !== nearEndRef.current) {
      nearEndRef.current = near;
      setAtEnd(near);
    }
  };

  const handleEndDrag = () => {
    if (overscrolled.current && !fired.current && onSeeMore) {
      fired.current = true;
      onSeeMore();
    }
  };

  if (data.length === 0 && !emptyText) return null;

  return (
    <YStack gap="$2">
      <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$4">
        <Text fontSize={20} fontWeight="700" color="$text" letterSpacing={-0.6}>
          {title}
        </Text>
        {onSeeMore ? (
          <Pressable onPress={onSeeMore} accessibilityRole="button" hitSlop={8}>
            <XStack alignItems="center" gap={2}>
              <Text fontSize={12.5} color="$textMuted" fontWeight="600">
                {t('home.seeMore')}
              </Text>
              <Chevron size={15} color={affordance} />
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
          data={items}
          keyExtractor={keyExtractor}
          renderItem={(info) => <StaggerIn index={info.index}>{renderItem(info)}</StaggerIn>}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 18, gap: 12 }}
          scrollEventThrottle={16}
          onScroll={onSeeMore ? handleScroll : undefined}
          onScrollEndDrag={onSeeMore ? handleEndDrag : undefined}
          onMomentumScrollEnd={() => {
            fired.current = false;
          }}
          ListFooterComponent={
            onSeeMore ? (
              <SeeAllArrow isRtl={isRtl} visible={atEnd} onPress={onSeeMore} />
            ) : null
          }
        />
      )}

      {footer}
    </YStack>
  );
}

/**
 * Cards rise into place one after another, ~55ms apart. Only the first handful
 * are staggered — past that the delay would be longer than the user's patience,
 * and offscreen cards should simply be there when scrolled to.
 */
function StaggerIn({ index, children }: { index: number; children: ReactNode }) {
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(p, {
      toValue: 1,
      duration: 320,
      delay: Math.min(index, 4) * 55,
      useNativeDriver: true,
    }).start();
  }, [index, p]);

  return (
    <Animated.View
      style={{
        opacity: p,
        transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Trailing affordance at the end of a section row: a chevron (matching the back
 * control) in a soft neutral circle, vertically centered to the row. It
 * fades in only once the row is scrolled near its end, with a gentle looping
 * nudge toward the see-all direction. Tap — or overscroll past it — opens the
 * full list.
 */
function SeeAllArrow({
  isRtl,
  visible,
  onPress,
}: {
  isRtl: boolean;
  visible: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const ink = theme.text?.val as string;
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const tx = useRef(new Animated.Value(0)).current;
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, appear]);

  useEffect(() => {
    const dir = isRtl ? -1 : 1;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(tx, { toValue: dir * 6, duration: 650, useNativeDriver: true }),
        Animated.timing(tx, { toValue: 0, duration: 650, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isRtl, tx]);

  const scale = appear.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ alignSelf: 'stretch', justifyContent: 'center', width: 64 }}
    >
      <Animated.View
        style={{ alignItems: 'center', opacity: appear, transform: [{ scale }, { translateX: tx }] }}
      >
        <YStack width={48} height={48} borderRadius={999} alignItems="center" justifyContent="center">
          {/* Soft neutral background; the chevron stays fully opaque. */}
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            borderRadius={999}
            backgroundColor="$bgSubtle"
          />
          <Chevron size={26} color={ink} />
        </YStack>
      </Animated.View>
    </Pressable>
  );
}
