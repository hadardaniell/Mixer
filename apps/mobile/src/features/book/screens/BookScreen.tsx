import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToggleBookFavorite, useToggleRecipeFavorite } from '@/features/home/hooks/useFavoriteMutations';
import { useIsRtl } from '@/shared/lib/useIsRtl';
import type { RecipeCardData } from '@/shared/ui/RecipeCard';

import { AddBookMembersSheet } from '../components/AddBookMembersSheet';
import { AddRecipesToBookSheet } from '../components/AddRecipesToBookSheet';
import { BookHero } from '../components/BookHero';
import { BookMembersSheet } from '../components/BookMembersSheet';
import { BookOverflowSheet } from '../components/BookOverflowSheet';
import { BookRecipeGrid } from '../components/BookRecipeGrid';
import { BookSkeleton } from '../components/BookSkeleton';
import { EditBookSheet } from '../components/EditBookSheet';
import { useBook } from '../hooks/useBook';
import { useBookMembers, type BookMember } from '../hooks/useBookMembers';
import { useBookMutations } from '../hooks/useBookMutations';
import { useBookRecipes } from '../hooks/useBookRecipes';

interface BookScreenProps {
  bookId: string;
}

/**
 * Recipe book detail: cover hero with the member avatar row, then the book's
 * recipes as a two-column grid with local search. Every mutating affordance is
 * gated on the viewer's role, mirroring what the API enforces.
 */
export function BookScreen({ bookId }: BookScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isRtl = useIsRtl();
  const { user } = useAuth();

  const { book, isOwner, canEdit, isLoading, isError } = useBook(bookId);
  const { members } = useBookMembers(book, user?.id);
  const { recipes, isLoading: recipesLoading } = useBookRecipes(book?.recipeIds ?? []);
  const mutations = useBookMutations(bookId);
  const toggleBookFavorite = useToggleBookFavorite();
  const toggleRecipeFavorite = useToggleRecipeFavorite();

  const [query, setQuery] = useState('');
  const [membersOpen, setMembersOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [addRecipesOpen, setAddRecipesOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? recipes.filter((r) => r.name.toLowerCase().includes(q)) : recipes;
  }, [recipes, query]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  if (isLoading) {
    return (
      <YStack flex={1} backgroundColor="$bg" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
        <BookSkeleton />
      </YStack>
    );
  }

  // A 403 lands here too: someone opened a book they were removed from.
  if (isError || !book) {
    return (
      <Centered>
        <Text color="$textMuted" fontSize={15} textAlign="center">
          {t('book.loadError')}
        </Text>
      </Centered>
    );
  }

  const leave = () => {
    if (!user?.id) return;
    mutations.removeMember.mutate(user.id, {
      onSuccess: () => {
        setMembersOpen(false);
        setOverflowOpen(false);
        goBack();
      },
    });
  };

  const confirmDelete = () => {
    setOverflowOpen(false);
    Alert.alert(t('book.deleteTitle'), t('book.deleteMessage', { name: book.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('book.deleteConfirm'),
        style: 'destructive',
        onPress: () => mutations.deleteBook.mutate(undefined, { onSuccess: goBack }),
      },
    ]);
  };

  const confirmLeaveFromOverflow = () => {
    setOverflowOpen(false);
    Alert.alert(t('book.leaveTitle'), t('book.leaveMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('book.leaveConfirm'), style: 'destructive', onPress: leave },
    ]);
  };

  const removeMember = (member: BookMember) => mutations.removeMember.mutate(member.userId);

  const memberBusy =
    mutations.addMembers.isPending ||
    mutations.removeMember.isPending ||
    mutations.updateMemberRole.isPending;

  return (
    <YStack flex={1} backgroundColor="$bg" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <BookHero
          book={book}
          members={members}
          recipeCount={book.recipeIds.length}
          isOwner={isOwner}
          canEdit={canEdit}
          onBack={goBack}
          onToggleFavorite={() =>
            toggleBookFavorite.mutate({ id: book.id, next: !(book.isFavorite ?? false) })
          }
          onOpenMembers={() => setMembersOpen(true)}
          onAddMembers={() => setAddMembersOpen(true)}
          onEditBook={() => setEditOpen(true)}
          onOverflow={() => setOverflowOpen(true)}
        />

        <BookRecipeGrid
          recipes={filtered}
          query={query}
          onQueryChange={setQuery}
          totalCount={recipes.length}
          canEdit={canEdit}
          isLoading={recipesLoading}
          onOpenRecipe={(id) => router.push(`/recipes/${id}`)}
          onToggleFavorite={(card: RecipeCardData & { isFavorite: boolean }) =>
            toggleRecipeFavorite.mutate({ id: card.id, next: !card.isFavorite })
          }
          onAddRecipes={() => setAddRecipesOpen(true)}
          onRemoveRecipe={(card) => mutations.removeRecipe.mutate(card.id)}
        />
      </ScrollView>

      <BookMembersSheet
        open={membersOpen}
        onOpenChange={setMembersOpen}
        members={members}
        isOwner={isOwner}
        busy={memberBusy}
        onAddMembers={() => {
          setMembersOpen(false);
          setAddMembersOpen(true);
        }}
        onChangeRole={(userId, role) => mutations.updateMemberRole.mutate({ userId, role })}
        onRemoveMember={removeMember}
        onLeave={leave}
      />

      <AddBookMembersSheet
        open={addMembersOpen}
        onOpenChange={setAddMembersOpen}
        existingMemberIds={book.members.map((m) => m.userId)}
        busy={mutations.addMembers.isPending}
        onConfirm={(userIds, role) =>
          mutations.addMembers.mutate(
            { userIds, role },
            { onSuccess: () => setAddMembersOpen(false) },
          )
        }
      />

      <AddRecipesToBookSheet
        open={addRecipesOpen}
        onOpenChange={setAddRecipesOpen}
        existingRecipeIds={book.recipeIds}
        busy={mutations.addRecipes.isPending}
        onConfirm={(recipeIds) =>
          mutations.addRecipes.mutate(recipeIds, { onSuccess: () => setAddRecipesOpen(false) })
        }
      />

      <EditBookSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        book={book}
        busy={mutations.updateBook.isPending}
        onSave={(input) =>
          mutations.updateBook.mutate(input, { onSuccess: () => setEditOpen(false) })
        }
      />

      <BookOverflowSheet
        open={overflowOpen}
        onOpenChange={setOverflowOpen}
        canEdit={canEdit}
        isOwner={isOwner}
        onEdit={() => {
          setOverflowOpen(false);
          setEditOpen(true);
        }}
        onManageMembers={() => {
          setOverflowOpen(false);
          setMembersOpen(true);
        }}
        onLeave={confirmLeaveFromOverflow}
        onDelete={confirmDelete}
      />
    </YStack>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <YStack flex={1} backgroundColor="$bg" alignItems="center" justifyContent="center" padding="$5">
      {children}
    </YStack>
  );
}
