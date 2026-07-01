import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';

import { resolveBookCover } from '@/shared/lib/coverImages';
import { useIsRtl } from '@/shared/lib/useIsRtl';
import { FEED_CARD_RADIUS } from '@/shared/ui/RecipeCard';
import { dir } from 'i18next';

const AVATAR_SIZE = 28;
const AVATAR_OVERLAP = -10;
const BOOK_CARD_WIDTH = 260;
const BOOK_CARD_HEIGHT = 126;
const COVER_SIZE = 116;

export interface BookCardMember {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

export interface BookCardData {
  id: string;
  name: string;
  recipeCount?: number;
  /** Key of a bundled cover illustration (e.g. "rbc3"). */
  coverKey?: string;
  /** Remote cover URL (e.g. a future Firebase upload). Takes precedence over coverKey. */
  coverImageUrl?: string;
  /** Legacy cover images — unused in the new design but kept on the shape so
   * existing call-sites don't break. */
  coverImages?: string[];
  members: BookCardMember[];
}

interface BookCardProps {
  book: BookCardData;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
  /** Override the fixed feed width — e.g. "100%" to fill a profile list row. */
  width?: number | string;
  /** Stronger shadow so the card reads on a white surface (e.g. the wizard preview). */
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
  isFavorited: _isFavorited,
  onToggleFavorite: _onToggleFavorite,
  onPress,
  width = BOOK_CARD_WIDTH,
  elevated = false,
}: BookCardProps) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const cover = resolveBookCover(book);

  const visible = book.members.slice(0, 3);
  const extra = Math.max(0, book.members.length - visible.length);

  return (
    <XStack
      onPress={onPress}
      width={width}
      height={BOOK_CARD_HEIGHT}
      borderRadius={FEED_CARD_RADIUS}
      backgroundColor="$surface"
      overflow="hidden"
      paddingRight={14}
      alignItems="center"
      shadowColor="black"
      shadowOpacity={elevated ? 0.24 : 0.08}
      shadowRadius={elevated ? 32 : 18}
      shadowOffset={{ width: 0, height: elevated ? 14 : 6 }}
      elevation={elevated ? 14 : 4}
      pressStyle={{ opacity: 0.92, scale: 0.98 }}
      style={{ direction: 'ltr' } as never}
    >
      {/* Cover bleeds to the card's left/top/bottom edges — bigger art, same card size. */}
      <YStack width={COVER_SIZE} height="100%" alignItems="center" justifyContent="center" overflow="hidden">
        <Image source={cover} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </YStack>

      {/* Text + avatars: padding on top/bottom and the cover side only — no right padding. */}
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
          {book.recipeCount != null ? (
            <Text
              width="100%"
              textAlign="right"
              fontSize={13}
              color="$textMuted"
              style={{ direction: isRtl ? 'rtl' : 'ltr', writingDirection: isRtl ? 'rtl' : 'ltr' } as never}
            >
              {t('home.recipesCount', { count: book.recipeCount })}
            </Text>
          ) : null}
        </YStack>

        {/* Overlapping avatar stack, hugging the cover (start) edge. Forced LTR so
            the overlap direction is predictable regardless of the app's RTL mode. */}
        {visible.length > 0 ? (
          <XStack alignItems="center" alignSelf="flex-start" style={{ direction: 'ltr' } as never}>
            {visible.map((m, idx) => (
              <Avatar key={m.id} member={m} overlap={idx > 0} />
            ))}
            {extra > 0 ? <MoreChip count={extra} /> : null}
          </XStack>
        ) : null}
      </YStack>
    </XStack>
  );
}

function Avatar({ member, overlap }: { member: BookCardMember; overlap: boolean }) {
  return (
    <YStack
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      borderRadius={AVATAR_SIZE / 2}
      borderWidth={2}
      borderColor="$surface"
      backgroundColor="$accentBlueGray"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      marginLeft={overlap ? AVATAR_OVERLAP : 0}
    >
      {member.avatarUrl ? (
        <Image source={{ uri: member.avatarUrl }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text color="white" fontSize={9} fontWeight="700">
          {initials(member.displayName)}
        </Text>
      )}
    </YStack>
  );
}

function MoreChip({ count }: { count: number }) {
  return (
    <YStack
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      borderRadius={AVATAR_SIZE / 2}
      backgroundColor="$gray3"
      alignItems="center"
      justifyContent="center"
      marginLeft={AVATAR_OVERLAP}
    >
      <Text color="$text" fontSize={12} fontWeight="700">
        +{count}
      </Text>
    </YStack>
  );
}
