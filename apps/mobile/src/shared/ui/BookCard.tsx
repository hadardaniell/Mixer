import { ChefHat } from 'lucide-react-native';
import { I18nManager, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { FEED_CARD_HEIGHT, FEED_CARD_RADIUS, FEED_CARD_WIDTH } from '@/shared/ui/RecipeCard';

const AVATAR_SIZE = 22;
const ICON_AREA_HEIGHT = 130;

export interface BookCardMember {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

export interface BookCardData {
  id: string;
  name: string;
  recipeCount?: number;
  /** Legacy cover images — unused in the new design but kept on the shape so
   * existing call-sites don't break. The new card uses a colored accent +
   * generic illustration instead. */
  coverImages?: string[];
  members: BookCardMember[];
}

interface BookCardProps {
  book: BookCardData;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
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

export function BookCard({ book, isFavorited: _isFavorited, onToggleFavorite: _onToggleFavorite, onPress }: BookCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const accentToken = `$${pickAccent(book.id)}` as const;
  const ink = theme.text?.val as string;

  const visible = book.members.slice(0, 3);
  const extra = Math.max(0, book.members.length - visible.length);

  return (
    <YStack
      onPress={onPress}
      width={FEED_CARD_WIDTH}
      height={FEED_CARD_HEIGHT}
      borderRadius={FEED_CARD_RADIUS}
      overflow="hidden"
      backgroundColor="$surface"
      shadowColor="black"
      shadowOpacity={0.06}
      shadowRadius={14}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={2}
      pressStyle={{ opacity: 0.92, scale: 0.98 }}
    >
      {/* Accent illustration area */}
      <YStack
        height={ICON_AREA_HEIGHT}
        backgroundColor={accentToken}
        alignItems="center"
        justifyContent="center"
      >
        <ChefHat size={56} color={ink} strokeWidth={1.5} />
      </YStack>

      <YStack flex={1} paddingHorizontal="$3" paddingVertical="$2.5" gap="$2" justifyContent="space-between">
        <YStack gap={2}>
          <Text fontSize={14} fontWeight="700" numberOfLines={1} color="$text">
            {book.name}
          </Text>
          {book.recipeCount != null ? (
            <Text fontSize={12} color="$textMuted">
              {t('home.recipesCount', { count: book.recipeCount })}
            </Text>
          ) : null}
        </YStack>

        {visible.length > 0 ? (
          <XStack alignItems="center">
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
  const startOverlap = I18nManager.isRTL ? 0 : overlap ? -6 : 0;
  const endOverlap = I18nManager.isRTL ? (overlap ? -6 : 0) : 0;
  return (
    <YStack
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      borderRadius={AVATAR_SIZE / 2}
      borderWidth={1.5}
      borderColor="$surface"
      backgroundColor="$accentBlueGray"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      marginStart={startOverlap}
      marginEnd={endOverlap}
    >
      {member.avatarUrl ? (
        <Image
          source={{ uri: member.avatarUrl }}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <Text color="white" fontSize={9} fontWeight="700">
          {initials(member.displayName)}
        </Text>
      )}
    </YStack>
  );
}

function MoreChip({ count }: { count: number }) {
  const startOverlap = I18nManager.isRTL ? 0 : -6;
  const endOverlap = I18nManager.isRTL ? -6 : 0;
  return (
    <YStack
      minWidth={AVATAR_SIZE}
      height={AVATAR_SIZE}
      paddingHorizontal={6}
      borderRadius={AVATAR_SIZE / 2}
      borderWidth={1.5}
      borderColor="$surface"
      backgroundColor="$primary"
      alignItems="center"
      justifyContent="center"
      marginStart={startOverlap}
      marginEnd={endOverlap}
    >
      <Text color="$textOnPrimary" fontSize={10} fontWeight="700">
        +{count}
      </Text>
    </YStack>
  );
}
