import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import { BookCoverArt } from '@/shared/ui/BookCoverArt';
import { FEED_CARD_SHADOW } from '@/shared/ui/RecipeCard';

const AVATAR_SIZE = 26;
const AVATAR_OVERLAP = -9;
const BOOK_CARD_WIDTH = 180;
const BOOK_CARD_RADIUS = 16;
const HORIZONTAL_HEIGHT = 116;
const HORIZONTAL_COVER = 108;
const VERTICAL_COVER = 132;

export interface BookCardMember {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

export interface BookCardData {
  id: string;
  name: string;
  recipeCount?: number;
  /** Composed cover: `"colorId.iconId"`. Legacy `rbc*` keys fall back. */
  coverKey?: string;
  coverImageUrl?: string;
  coverImages?: string[];
  members: BookCardMember[];
}

interface BookCardProps {
  book: BookCardData;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
  /** Override the fixed width — e.g. "100%" to fill a list row. */
  width?: number | string;
  /**
   * `vertical` (cover on top, feed cards) or `horizontal` (cover on the start
   * edge, list rows). Horizontal is the default so the full-width list usages
   * are unaffected; the feed opts into vertical.
   */
  layout?: 'horizontal' | 'vertical';
  /** Stronger shadow so the card reads on a white surface (wizard preview). */
  elevated?: boolean;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    parts
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join('')
      .toUpperCase() || '?'
  );
}

export function BookCard({
  book,
  onPress,
  width,
  layout = 'horizontal',
  elevated = false,
}: BookCardProps) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  const visible = book.members.slice(0, 3);
  const extra = Math.max(0, book.members.length - visible.length);

  const shadow = elevated
    ? {
        shadowColor: 'black' as const,
        shadowOpacity: 0.22,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 12,
      }
    : FEED_CARD_SHADOW;

  const avatars =
    visible.length > 0 ? (
      <XStack alignItems="center" style={{ direction: 'ltr' } as never}>
        {visible.map((m, idx) => (
          <Avatar key={m.id} member={m} overlap={idx > 0} />
        ))}
        {extra > 0 ? <MoreChip count={extra} /> : null}
      </XStack>
    ) : null;

  const count =
    book.recipeCount != null ? (
      <Text
        fontSize={12}
        color="$textMuted"
        numberOfLines={1}
        style={{ writingDirection: isRtl ? 'rtl' : 'ltr' } as never}
      >
        {t('home.recipesCount', { count: book.recipeCount })}
      </Text>
    ) : null;

  // ── Vertical: cover on top, meta below (feed / grid). ──────────────────────
  if (layout === 'vertical') {
    return (
      <YStack
        onPress={onPress}
        width={width ?? BOOK_CARD_WIDTH}
        borderRadius={BOOK_CARD_RADIUS}
        backgroundColor="$surface"
        overflow="hidden"
        {...shadow}
        pressStyle={{ opacity: 0.92, scale: 0.98 }}
      >
        <YStack height={VERTICAL_COVER} width="100%">
          <BookCoverArt coverKey={book.coverKey} size={VERTICAL_COVER} />
        </YStack>
        <YStack
          padding={12}
          gap={2}
          alignItems={isRtl ? 'flex-end' : 'flex-start'}
          style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
        >
          <Text
            width="100%"
            textAlign={isRtl ? 'right' : 'left'}
            fontSize={15}
            fontWeight="700"
            numberOfLines={1}
            color="$text"
          >
            {book.name}
          </Text>
          {count}
          {avatars ? <YStack marginTop={6}>{avatars}</YStack> : null}
        </YStack>
      </YStack>
    );
  }

  // ── Horizontal: cover on the start edge, meta on the end (list rows). ──────
  return (
    <YStack
      onPress={onPress}
      width={width ?? 260}
      height={HORIZONTAL_HEIGHT}
      borderRadius={BOOK_CARD_RADIUS}
      backgroundColor="$surface"
      overflow="hidden"
      {...shadow}
      pressStyle={{ opacity: 0.92, scale: 0.98 }}
    >
      <XStack
        flex={1}
        width="100%"
        alignItems="center"
        paddingRight={14}
        style={{ direction: 'ltr' } as never}
      >
        <YStack width={HORIZONTAL_COVER} height="100%">
          <BookCoverArt coverKey={book.coverKey} size={HORIZONTAL_COVER} />
        </YStack>

        <YStack
          flex={1}
          height="100%"
          paddingVertical={14}
          paddingStart={12}
          justifyContent="space-between"
          alignItems="flex-end"
        >
          <YStack gap={4} width="100%" alignItems="flex-end">
            <Text
              width="100%"
              textAlign="right"
              fontSize={15}
              fontWeight="700"
              numberOfLines={1}
              color="$text"
            >
              {book.name}
            </Text>
            {count ? (
              <Text width="100%" textAlign="right" fontSize={12} color="$textMuted" numberOfLines={1}>
                {t('home.recipesCount', { count: book.recipeCount })}
              </Text>
            ) : null}
          </YStack>
          {/* Avatars sit under the text on the end (reading) side, not hugging
              the cover — the cramped-against-cover look was the complaint. */}
          {avatars ? <YStack alignSelf="flex-end">{avatars}</YStack> : null}
        </YStack>
      </XStack>
    </YStack>
  );
}

/** Light-grey avatar, matching the notification + home-header style
 *  (`$bgSubtle` fill, `$textMuted` initials) — not the old dark blue-grey. */
function Avatar({ member, overlap }: { member: BookCardMember; overlap: boolean }) {
  return (
    <YStack
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      borderRadius={AVATAR_SIZE / 2}
      borderWidth={2}
      borderColor="$surface"
      backgroundColor="$bgSubtle"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      marginLeft={overlap ? AVATAR_OVERLAP : 0}
    >
      {member.avatarUrl ? (
        <Image source={{ uri: member.avatarUrl }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text color="$textMuted" fontSize={9} fontWeight="700">
          {initials(member.displayName)}
        </Text>
      )}
    </YStack>
  );
}

/** "+N" for members beyond the three shown — a touch darker than the avatars so
 *  it reads as "more", not another person. */
function MoreChip({ count }: { count: number }) {
  return (
    <YStack
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      borderRadius={AVATAR_SIZE / 2}
      borderWidth={2}
      borderColor="$surface"
      backgroundColor="$gray4"
      alignItems="center"
      justifyContent="center"
      marginLeft={AVATAR_OVERLAP}
    >
      <Text color="$gray11" fontSize={10} fontWeight="700">
        +{count}
      </Text>
    </YStack>
  );
}
