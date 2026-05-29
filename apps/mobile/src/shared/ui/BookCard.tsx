import { I18nManager, Image } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { FavoriteButton } from '@/shared/ui/FavoriteButton';
import {
  FEED_CARD_HEIGHT,
  FEED_CARD_RADIUS,
  FEED_CARD_SHADOW,
  FEED_CARD_WIDTH,
} from '@/shared/ui/RecipeCard';

const IMAGE_AREA_HEIGHT = 140;
const AVATAR_SIZE = 24;

export interface BookCardMember {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

export interface BookCardData {
  id: string;
  name: string;
  coverImages: string[];
  members: BookCardMember[];
}

interface BookCardProps {
  book: BookCardData;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const chars = parts.slice(0, 2).map((p) => p.charAt(0));
  return chars.join('').toUpperCase() || '?';
}

function CoverGrid({ images }: { images: string[] }) {
  if (images.length === 0) {
    return <YStack flex={1} backgroundColor="$gray4" />;
  }
  if (images.length === 1) {
    return <Image source={{ uri: images[0] }} style={{ width: '100%', height: '100%' }} />;
  }
  const padded: (string | null)[] = [
    images[0] ?? null,
    images[1] ?? null,
    images[2] ?? null,
    images[3] ?? null,
  ];
  return (
    <YStack flex={1}>
      <XStack flex={1}>
        <Tile uri={padded[0]} />
        <Tile uri={padded[1]} />
      </XStack>
      <XStack flex={1}>
        <Tile uri={padded[2]} />
        <Tile uri={padded[3]} />
      </XStack>
    </YStack>
  );
}

function Tile({ uri }: { uri: string | null }) {
  return (
    <YStack flex={1} backgroundColor="$gray4" borderColor="white" borderWidth={1}>
      {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} /> : null}
    </YStack>
  );
}

function Avatar({ member, overlap }: { member: BookCardMember; overlap: boolean }) {
  const startOverlap = I18nManager.isRTL ? 0 : overlap ? -8 : 0;
  const endOverlap = I18nManager.isRTL ? (overlap ? -8 : 0) : 0;
  return (
    <YStack
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      borderRadius={AVATAR_SIZE / 2}
      borderWidth={2}
      borderColor="white"
      backgroundColor="$blue8"
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
        <Text color="white" fontSize={10} fontWeight="700">
          {initials(member.displayName)}
        </Text>
      )}
    </YStack>
  );
}

function MoreChip({ overlap }: { overlap: boolean }) {
  const startOverlap = I18nManager.isRTL ? 0 : overlap ? -8 : 0;
  const endOverlap = I18nManager.isRTL ? (overlap ? -8 : 0) : 0;
  return (
    <YStack
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      borderRadius={AVATAR_SIZE / 2}
      borderWidth={2}
      borderColor="white"
      backgroundColor="$gray9"
      alignItems="center"
      justifyContent="center"
      marginStart={startOverlap}
      marginEnd={endOverlap}
    >
      <Text color="white" fontSize={10} fontWeight="700">
        …
      </Text>
    </YStack>
  );
}

export function BookCard({ book, isFavorited, onToggleFavorite, onPress }: BookCardProps) {
  const visible = book.members.slice(0, 2);
  const hasMore = book.members.length > visible.length;

  return (
    <YStack
      onPress={onPress}
      width={FEED_CARD_WIDTH}
      height={FEED_CARD_HEIGHT}
      borderRadius={FEED_CARD_RADIUS}
      overflow="hidden"
      backgroundColor="white"
      {...FEED_CARD_SHADOW}
      pressStyle={{ opacity: 0.92, scale: 0.98 }}
    >
      <YStack height={IMAGE_AREA_HEIGHT}>
        <CoverGrid images={book.coverImages} />

        {book.members.length > 0 ? (
          <XStack
            position="absolute"
            top={8}
            end={8}
            alignItems="center"
          >
            {visible.map((m, idx) => (
              <Avatar key={m.id} member={m} overlap={idx > 0} />
            ))}
            {hasMore ? <MoreChip overlap={visible.length > 0} /> : null}
          </XStack>
        ) : null}
      </YStack>

      <XStack
        flex={1}
        paddingHorizontal="$3"
        paddingVertical="$2"
        alignItems="center"
        justifyContent="space-between"
        gap="$2"
      >
        <YStack flex={1} gap={2}>
          <Text fontSize="$3" fontWeight="600" numberOfLines={1} color="$gray12">
            {book.name}
          </Text>
        </YStack>

        <FavoriteButton isFavorited={isFavorited} onPress={onToggleFavorite} size={20} />
      </XStack>
    </YStack>
  );
}
