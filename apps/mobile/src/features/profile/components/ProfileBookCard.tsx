import {
  CakeSlice,
  ChefHat,
  Coffee,
  Cookie,
  Globe,
  Leaf,
  Salad,
  Soup,
  type LucideIcon,
} from 'lucide-react-native';
import { I18nManager, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import type { BookCardData, BookCardMember } from '@/shared/ui/BookCard';

const AVATAR_SIZE = 26;
const AVATAR_OVERLAP = -8;

const ACCENT_KEYS = [
  'accentLavender',
  'accentMint',
  'accentPink',
  'accentPeach',
  'accentLime',
] as const;

const ILLUSTRATIONS: LucideIcon[] = [Salad, Soup, CakeSlice, Leaf, Globe, Cookie, ChefHat, Coffee];

function hash(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return sum;
}

function pickAccent(id: string) {
  return ACCENT_KEYS[hash(id) % ACCENT_KEYS.length]!;
}

function pickIllustration(id: string): LucideIcon {
  return ILLUSTRATIONS[hash(id) % ILLUSTRATIONS.length]!;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase() || '?';
}

interface ProfileBookCardProps {
  book: BookCardData;
  onPress: () => void;
  /** Fixed width for horizontal scrollers; omit to flex inside a grid. */
  width?: number;
}

/**
 * Vertical book card used on the profile page — a pastel accent panel with a
 * generic illustration on top, then the book name, recipe count and (when the
 * book is shared) the members' avatars. Mirrors the design language of the
 * horizontal feed `BookCard` but in a portrait shape for grids.
 */
export function ProfileBookCard({ book, onPress, width }: ProfileBookCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const ink = theme.text?.val as string;
  const accentToken = `$${pickAccent(book.id)}` as const;
  const Illustration = pickIllustration(book.id);

  const visible = book.members.slice(0, 3);
  const extra = Math.max(0, book.members.length - visible.length);

  return (
    <YStack
      onPress={onPress}
      width={width}
      flex={width == null ? 1 : undefined}
      borderRadius={18}
      backgroundColor="$surface"
      overflow="hidden"
      shadowColor="black"
      shadowOpacity={0.08}
      shadowRadius={18}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={4}
      pressStyle={{ opacity: 0.92, scale: 0.98 }}
    >
      <YStack
        height={104}
        backgroundColor={accentToken}
        alignItems="center"
        justifyContent="center"
      >
        <Illustration size={42} color={ink} strokeWidth={1.7} />
      </YStack>

      <YStack padding="$3" gap="$2" alignItems="flex-end">
        <Text width="100%" textAlign="right" fontSize={15} fontWeight="700" numberOfLines={2} color="$text">
          {book.name}
        </Text>
        {book.recipeCount != null ? (
          <Text width="100%" textAlign="right" fontSize={13} color="$textMuted">
            {t('home.recipesCount', { count: book.recipeCount })}
          </Text>
        ) : null}

        {visible.length > 0 ? (
          <XStack alignItems="center" style={{ direction: 'rtl' } as never}>
            {visible.map((m, idx) => (
              <Avatar key={m.id} member={m} overlap={idx > 0} />
            ))}
            {extra > 0 ? <MoreChip count={extra} /> : null}
          </XStack>
        ) : null}
      </YStack>
    </YStack>
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
      backgroundColor="$accentLavender"
      alignItems="center"
      justifyContent="center"
      marginStart={startOverlap}
      marginEnd={endOverlap}
    >
      <Text color="$primary" fontSize={11} fontWeight="700">
        +{count}
      </Text>
    </YStack>
  );
}
