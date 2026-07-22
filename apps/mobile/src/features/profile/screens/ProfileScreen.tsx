import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, YStack } from 'tamagui';

import { useLanguage } from '@/features/settings/hooks/useLanguage';
import {
  useToggleBookFavorite,
  useToggleRecipeFavorite,
} from '@/features/home/hooks/useFavoriteMutations';
import { ProfileFilterChips, type FavoritesFilter } from '@/features/profile/components/ProfileFilterChips';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileTabs, type ProfileTab } from '@/features/profile/components/ProfileTabs';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { isRTL } from '@/shared/lib/i18n';
import { BookCard } from '@/shared/ui/BookCard';
import { FeedSection } from '@/shared/ui/FeedSection';
import { RecipeCard } from '@/shared/ui/RecipeCard';

interface ProfileScreenProps {
  /** Defaults to the authenticated user when omitted. */
  userId?: string;
}

export function ProfileScreen({ userId }: ProfileScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRtl = isRTL(language);

  const profile = useProfile(userId);
  const toggleRecipe = useToggleRecipeFavorite();
  const toggleBook = useToggleBookFavorite();

  const [tab, setTab] = useState<ProfileTab>('favorites');
  const [filter, setFilter] = useState<FavoritesFilter>('all');

  const openRecipe = (id: string) => router.push(`/recipes/${id}` as never);
  const openBook = (id: string) => router.push(`/books/${id}` as never);

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg?.val as string }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap="$4" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
        <YStack paddingHorizontal="$4">
          <ProfileHeader
            user={profile.user}
            isSelf={profile.isSelf}
            stats={profile.stats}
            onSettings={() => router.push('/settings')}
            onEditProfile={() => router.push('/profile/edit' as never)}
            onAddFriends={() => router.push('/friends/add' as never)}
          />
        </YStack>

        <YStack paddingHorizontal="$4">
          <ProfileTabs value={tab} onChange={setTab} />
        </YStack>

        {profile.isLoading ? (
          <YStack paddingVertical="$6" alignItems="center">
            <ActivityIndicator color={theme.primary?.val as string} />
          </YStack>
        ) : tab === 'favorites' ? (
          <YStack gap="$4">
            <YStack paddingHorizontal="$4">
              <ProfileFilterChips value={filter} onChange={setFilter} />
            </YStack>

            {filter !== 'books' ? (
              <FeedSection
                title={t('profile.favoriteRecipes')}
                data={profile.favoriteRecipes}
                keyExtractor={(r) => r.id}
                emptyText={t('profile.empty.favorites')}
                renderItem={({ item }) => (
                  <RecipeCard
                    recipe={item}
                    isFavorited={item.isFavorite}
                    onToggleFavorite={() =>
                      toggleRecipe.mutate({ id: item.id, next: !item.isFavorite })
                    }
                    onPress={() => openRecipe(item.id)}
                  />
                )}
              />
            ) : null}

            {filter !== 'recipes' ? (
              <FeedSection
                title={t('profile.favoriteBooks')}
                data={profile.favoriteBooks}
                keyExtractor={(b) => b.id}
                emptyText={t('profile.empty.favorites')}
                renderItem={({ item }) => (
                  <BookCard
                    book={item}
                    isFavorited={item.isFavorite}
                    onToggleFavorite={() =>
                      toggleBook.mutate({ id: item.id, next: !item.isFavorite })
                    }
                    onPress={() => openBook(item.id)}
                  />
                )}
              />
            ) : null}
          </YStack>
        ) : tab === 'books' ? (
          profile.books.length === 0 ? (
            <YStack paddingHorizontal="$4" paddingVertical="$3">
              <Text color="$textMuted" fontSize={13}>
                {t('profile.empty.books')}
              </Text>
            </YStack>
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
          <Grid emptyText={t('profile.empty.recipes')} count={profile.recipes.length}>
            {profile.recipes.map((r) => (
              <Cell key={r.id}>
                <RecipeCard
                  recipe={r}
                  width="100%"
                  isFavorited={r.isFavorite}
                  onToggleFavorite={() =>
                    toggleRecipe.mutate({ id: r.id, next: !r.isFavorite })
                  }
                  onPress={() => openRecipe(r.id)}
                />
              </Cell>
            ))}
          </Grid>
        )}
      </YStack>
    </ScrollView>
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
