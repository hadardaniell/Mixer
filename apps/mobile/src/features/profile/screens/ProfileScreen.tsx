import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, YStack } from 'tamagui';

import { useLanguage } from '@/features/settings/hooks/useLanguage';
import {
  useToggleBookFavorite,
  useToggleRecipeFavorite,
} from '@/features/home/hooks/useFavoriteMutations';
import { ProfileBanner } from '@/features/profile/components/ProfileBanner';
import { ProfileContentSkeleton } from '@/features/profile/components/ProfileContentSkeleton';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileTabs, type ProfileTab } from '@/features/profile/components/ProfileTabs';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { usePickAvatar } from '@/features/settings/hooks/usePickAvatar';
import { isRTL } from '@/shared/lib/i18n';
import { BookCard } from '@/shared/ui/BookCard';
import { RecipeCard } from '@/shared/ui/RecipeCard';

interface ProfileScreenProps {
  /** Defaults to the authenticated user when omitted. */
  userId?: string;
}

export function ProfileScreen({ userId }: ProfileScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRtl = isRTL(language);

  const profile = useProfile(userId);
  const toggleRecipe = useToggleRecipeFavorite();
  const toggleBook = useToggleBookFavorite();
  const avatar = usePickAvatar();

  const [tab, setTab] = useState<ProfileTab>('recipes');

  const openRecipe = (id: string) => router.push(`/recipes/${id}` as never);
  const openBook = (id: string) => router.push(`/books/${id}` as never);

  return (
    <YStack flex={1} backgroundColor="$bg">
      {/* Full-bleed gradient band — starts at the very top edge (under the status
          bar) and spans edge to edge, behind the scrolling content. */}
      <ProfileBanner height={insets.top + 140} />

      <ScrollView
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
      <YStack gap="$4" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
        <YStack paddingHorizontal="$4">
          <ProfileHeader
            user={profile.user}
            isSelf={profile.isSelf}
            stats={profile.stats}
            avatarPreview={avatar.preview}
            isUploadingAvatar={avatar.isUploading}
            onSettings={() => router.push('/settings')}
            onChangeAvatar={() => void avatar.pick()}
            onAddFriends={() => router.push('/friends/add' as never)}
            onFriends={() => router.push('/friends' as never)}
          />
        </YStack>

        <YStack paddingHorizontal="$4">
          <ProfileTabs value={tab} onChange={setTab} />
        </YStack>

        {profile.isLoading ? (
          <ProfileContentSkeleton />
        ) : tab === 'recipes' ? (
          <Grid emptyText={t('profile.empty.recipes')} count={profile.recipes.length}>
            {profile.recipes.map((r) => (
              <Cell key={r.id}>
                <RecipeCard
                  recipe={r}
                  width="100%"
                  isFavorited={r.isFavorite}
                  onToggleFavorite={() => toggleRecipe.mutate({ id: r.id, next: !r.isFavorite })}
                  onPress={() => openRecipe(r.id)}
                />
              </Cell>
            ))}
          </Grid>
        ) : tab === 'books' ? (
          profile.books.length === 0 ? (
            <EmptyText text={t('profile.empty.books')} />
          ) : (
            <YStack paddingHorizontal="$4" gap={14}>
              {profile.books.map((b) => (
                <BookCard
                  key={b.id}
                  book={b}
                  width="100%"
                  isFavorited={b.isFavorite}
                  onToggleFavorite={() => toggleBook.mutate({ id: b.id, next: !b.isFavorite })}
                  onPress={() => openBook(b.id)}
                />
              ))}
            </YStack>
          )
        ) : (
          // Favorites — recipes as a grid, then favorited books as rows below.
          // Same presentation as the other tabs, no filter chips.
          <YStack gap="$4">
            {profile.favoriteRecipes.length > 0 ? (
              <YStack gap="$2">
                <SubLabel text={t('profile.favoriteRecipes')} isRtl={isRtl} />
                <Grid count={profile.favoriteRecipes.length} emptyText="">
                  {profile.favoriteRecipes.map((r) => (
                    <Cell key={r.id}>
                      <RecipeCard
                        recipe={r}
                        width="100%"
                        isFavorited={r.isFavorite}
                        onToggleFavorite={() => toggleRecipe.mutate({ id: r.id, next: !r.isFavorite })}
                        onPress={() => openRecipe(r.id)}
                      />
                    </Cell>
                  ))}
                </Grid>
              </YStack>
            ) : null}

            {profile.favoriteBooks.length > 0 ? (
              <YStack gap="$2">
                <SubLabel text={t('profile.favoriteBooks')} isRtl={isRtl} />
                <YStack paddingHorizontal="$4" gap={14}>
                  {profile.favoriteBooks.map((b) => (
                    <BookCard
                      key={b.id}
                      book={b}
                      width="100%"
                      isFavorited={b.isFavorite}
                      onToggleFavorite={() => toggleBook.mutate({ id: b.id, next: !b.isFavorite })}
                      onPress={() => openBook(b.id)}
                    />
                  ))}
                </YStack>
              </YStack>
            ) : null}

            {profile.favoriteRecipes.length === 0 && profile.favoriteBooks.length === 0 ? (
              <EmptyText text={t('profile.empty.favorites')} />
            ) : null}
          </YStack>
        )}
      </YStack>
      </ScrollView>
    </YStack>
  );
}

/** Two-column responsive grid with an empty fallback. */
function Grid({
  children,
  count,
  emptyText,
}: {
  children: React.ReactNode;
  count: number;
  emptyText: string;
}) {
  if (count === 0) {
    return (
      <YStack paddingHorizontal="$4" paddingVertical="$3">
        <Text color="$textMuted" fontSize={13}>
          {emptyText}
        </Text>
      </YStack>
    );
  }
  return (
    <YStack
      paddingHorizontal="$4"
      flexDirection="row"
      flexWrap="wrap"
      justifyContent="space-between"
      style={{ rowGap: 16 } as never}
    >
      {children}
    </YStack>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <YStack width="48%">{children}</YStack>;
}

function EmptyText({ text }: { text: string }) {
  return (
    <YStack paddingHorizontal="$4" paddingVertical="$3">
      <Text color="$textMuted" fontSize={13}>
        {text}
      </Text>
    </YStack>
  );
}

/** Small section label inside the favorites tab. */
function SubLabel({ text, isRtl }: { text: string; isRtl: boolean }) {
  return (
    <Text
      paddingHorizontal="$4"
      fontSize={12}
      fontWeight="700"
      letterSpacing={1.2}
      color="$textMuted"
      textAlign={isRtl ? 'right' : 'left'}
    >
      {text}
    </Text>
  );
}
