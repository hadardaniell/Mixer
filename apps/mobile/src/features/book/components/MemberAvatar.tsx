import { Image } from 'react-native';
import { Text, YStack } from 'tamagui';

/** Two-letter fallback when a member has no avatar image. */
export function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (
    parts
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join('')
      .toUpperCase() || '?'
  );
}

interface Props {
  displayName: string;
  avatarUrl?: string;
  size?: number;
  /** Adds a surface-colored ring so overlapping avatars stay separable. */
  ringed?: boolean;
}

export function MemberAvatar({ displayName, avatarUrl, size = 44, ringed = false }: Props) {
  return (
    <YStack
      width={size}
      height={size}
      borderRadius={999}
      overflow="hidden"
      // Same grey + white ink as the avatars on BookCard, so a member looks
      // identical on the card and inside the book.
      backgroundColor="$accentBlueGray"
      alignItems="center"
      justifyContent="center"
      {...(ringed ? { borderWidth: 2, borderColor: '$surface' as const } : {})}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text color="white" fontSize={size * 0.36} fontWeight="700">
          {initials(displayName)}
        </Text>
      )}
    </YStack>
  );
}
