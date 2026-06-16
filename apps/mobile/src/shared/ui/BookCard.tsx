import { CakeSlice } from 'lucide-react-native';
import { I18nManager, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { coverSource } from '@/shared/lib/coverImages';
import { FEED_CARD_RADIUS } from '@/shared/ui/RecipeCard';

const AVATAR_SIZE = 28;
const AVATAR_OVERLAP = -8;
const BOOK_CARD_WIDTH = 260;
const BOOK_CARD_HEIGHT = 126;
const COVER_SIZE = 94;

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
  /** Stronger shadow so the card reads on a white surface (e.g. the wizard preview). */
  elevated?: boolean;
}

const ACCENT_KEYS = [
  'accentLavender',
  'accentMint',
  'accentPink',
  'accentPeach',
  'accentLime',
] as const;

function pickAccent(id: string): (typeof ACCENT_KEYS)[number] {
  // Deterministic, stable per id — char-sum mod len.
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return ACCENT_KEYS[sum % ACCENT_KEYS.length]!;
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
  elevated = false,
}: BookCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const accentToken = `$${pickAccent(book.id)}` as const;
  const ink = theme.text?.val as string;

  const cover = book.coverImageUrl
    ? { uri: book.coverImageUrl }
    : coverSource(book.coverKey);

  const visible = book.members.slice(0, 3);
  const extra = Math.max(0, book.members.length - visible.length);

  return (
    <XStack
      onPress={onPress}
      width={BOOK_CARD_WIDTH}
      height={BOOK_CARD_HEIGHT}
      borderRadius={FEED_CARD_RADIUS}
      backgroundColor="$surface"
      padding={14}
      gap={14}
      alignItems="center"
      shadowColor="black"
      shadowOpacity={elevated ? 0.24 : 0.08}
      shadowRadius={elevated ? 32 : 18}
      shadowOffset={{ width: 0, height: elevated ? 14 : 6 }}
      elevation={elevated ? 14 : 4}
      pressStyle={{ opacity: 0.92, scale: 0.98 }}
      style={{ direction: 'ltr' } as never}
    >
      <YStack
        width={COVER_SIZE}
        height={COVER_SIZE}
        borderRadius={26}
        backgroundColor={cover ? 'transparent' : accentToken}
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        {cover ? (
          <Image source={cover} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <CakeSlice size={48} color={ink} strokeWidth={1.7} />
        )}
      </YStack>

      <YStack flex={1} height="100%" justifyContent="space-between" alignItems="flex-end">
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
            <Text width="100%" textAlign="right" fontSize={13} color="$textMuted">
              {t('home.recipesCount', { count: book.recipeCount })}
            </Text>
          ) : null}
        </YStack>

        {visible.length > 0 ? (
          <XStack alignItems="center" style={{ direction: 'rtl' } as never}>
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
  const startOverlap = I18nManager.isRTL ? 0 : overlap ? AVATAR_OVERLAP : 0;
  const endOverlap = I18nManager.isRTL ? (overlap ? AVATAR_OVERLAP : 0) : 0;
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
      marginStart={startOverlap}
      marginEnd={endOverlap}
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
  const startOverlap = I18nManager.isRTL ? 0 : AVATAR_OVERLAP;
  const endOverlap = I18nManager.isRTL ? AVATAR_OVERLAP : 0;
  return (
    <YStack
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      borderRadius={AVATAR_SIZE / 2}
      backgroundColor="$gray3"
      alignItems="center"
      justifyContent="center"
      marginStart={startOverlap}
      marginEnd={endOverlap}
    >
      <Text color="$text" fontSize={12} fontWeight="700">
        +{count}
      </Text>
    </YStack>
  );
}
