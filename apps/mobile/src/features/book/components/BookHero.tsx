import type { RecipeBook } from '@mixer/contracts';
import { ArrowLeft, ArrowRight, MoreVertical, Pencil, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { resolveBookCover } from '@/shared/lib/coverImages';
import { useIsRtl } from '@/shared/lib/useIsRtl';
import { FavoriteButton } from '@/shared/ui/FavoriteButton';

import type { BookMember } from '../hooks/useBookMembers';
import { MemberAvatar } from './MemberAvatar';

const COVER_HEIGHT = 220;
const AVATAR_SIZE = 34;
const AVATAR_OVERLAP = -12;
const MAX_AVATARS = 4;

interface Props {
  book: RecipeBook;
  members: BookMember[];
  recipeCount: number;
  isOwner: boolean;
  /** True for owners and editors — the roles the API lets rename a book. */
  canEdit: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
  onOpenMembers: () => void;
  onAddMembers: () => void;
  onEditBook: () => void;
  onOverflow: () => void;
}

/**
 * The book's header: full-bleed cover art with floating back/overflow controls,
 * then the title block, counts and the member avatar row. Tapping the avatars
 * opens the members sheet; the owner also gets an "add friends" pill.
 */
export function BookHero({
  book,
  members,
  recipeCount,
  isOwner,
  canEdit,
  onBack,
  onToggleFavorite,
  onOpenMembers,
  onAddMembers,
  onEditBook,
  onOverflow,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;
  // "Back" points the way the user came from, which flips with the reading direction.
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const visible = members.slice(0, MAX_AVATARS);
  const extra = Math.max(0, members.length - visible.length);

  return (
    <YStack width="100%">

      <YStack paddingHorizontal={20} paddingTop={16} gap={12}>
        <XStack alignItems="center" gap="$3">
          <Text
            flex={1}
            color="$text"
            fontSize={26}
            fontWeight="700"
            letterSpacing={-0.5}
            numberOfLines={2}
          >
            {book.name}
          </Text>

          {/* Pencil then star, so the star lands on the outer edge of the row.
              The edit pencil only shows for owners and editors. */}
          <XStack alignItems="center" gap="$1">
            {canEdit ? (
              <YStack
                onPress={onEditBook}
                role="button"
                aria-label={t('book.edit.title')}
                width={38}
                height={38}
                alignItems="center"
                justifyContent="center"
                pressStyle={{ opacity: 0.7 }}
              >
                <Pencil size={22} color={theme.textMuted?.val as string} strokeWidth={2} />
              </YStack>
            ) : null}
            <FavoriteButton
              plain
              isFavorited={book.isFavorite ?? false}
              onPress={onToggleFavorite}
              size={26}
            />
          </XStack>
        </XStack>

        {book.description ? (
          <Text color="$textMuted" fontSize={15} lineHeight={21}>
            {book.description}
          </Text>
        ) : null}

        <Text color="$textMuted" fontSize={13}>
          {t('book.counts', { recipes: recipeCount, members: members.length })}
        </Text>

        <XStack alignItems="center" gap="$3">
          {visible.length > 0 ? (
            <Pressable accessibilityRole="button" onPress={onOpenMembers} hitSlop={6}>
              <XStack alignItems="center" style={{ direction: 'ltr' } as never}>
                {visible.map((m, idx) => (
                  <YStack key={m.userId} marginLeft={idx > 0 ? AVATAR_OVERLAP : 0}>
                    <MemberAvatar
                      displayName={m.displayName}
                      avatarUrl={m.avatarUrl}
                      size={AVATAR_SIZE}
                      ringed
                    />
                  </YStack>
                ))}
                {extra > 0 ? (
                  <YStack
                    width={AVATAR_SIZE}
                    height={AVATAR_SIZE}
                    borderRadius={999}
                    backgroundColor="$gray3"
                    borderWidth={2}
                    borderColor="$surface"
                    alignItems="center"
                    justifyContent="center"
                    marginLeft={AVATAR_OVERLAP}
                  >
                    <Text color="$text" fontSize={12} fontWeight="700">
                      +{extra}
                    </Text>
                  </YStack>
                ) : null}
              </XStack>
            </Pressable>
          ) : null}

          {isOwner ? (
            <XStack
              onPress={onAddMembers}
              alignItems="center"
              gap="$1"
              height={36}
              paddingHorizontal={14}
              borderRadius={999}
              backgroundColor="$surface"
              borderWidth={1.5}
              borderColor="$primary"
              pressStyle={{ backgroundColor: '$bgSubtle' }}
            >
              {/* The label takes step 11, not `$primary`. Step 9 is 3.0:1 on
                  white and fails as text; it's fine on the outline, which is a
                  graphic and only needs 3:1. */}
              <Plus size={16} color={theme.textOnPrimary?.val as string} strokeWidth={2.5} />
              <Text color="$textOnPrimary" fontSize={14} fontWeight="700">
                {t('book.addMembers')}
              </Text>
            </XStack>
          ) : null}
        </XStack>
      </YStack>
    </YStack>
  );
}

function CircleButton({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <YStack
      onPress={onPress}
      width={40}
      height={40}
      borderRadius={999}
      backgroundColor="$surface"
      alignItems="center"
      justifyContent="center"
      shadowColor="black"
      shadowOpacity={0.08}
      shadowRadius={12}
      shadowOffset={{ width: 0, height: 4 }}
      elevation={3}
      pressStyle={{ opacity: 0.85 }}
    >
      {children}
    </YStack>
  );
}
