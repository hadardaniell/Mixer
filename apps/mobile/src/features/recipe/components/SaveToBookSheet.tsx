import type { RecipeBook } from '@mixer/contracts';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { feedApi } from '@/features/home/api/feedApi';
import { useAddRecipeToBook } from '@/features/recipe/hooks/useAddRecipeToBook';
import { BookCard, type BookCardData } from '@/shared/ui/BookCard';
import { Sheet } from '@/shared/ui/Sheet';

interface SaveToBookSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
}

function toBookCard(b: RecipeBook): BookCardData {
  return {
    id: b.id,
    name: b.name,
    recipeCount: b.recipeIds.length,
    coverKey: b.coverKey,
    coverImageUrl: b.coverImageUrl,
    members: [],
  };
}

/**
 * "Save to a book" picker: lists the books the user belongs to, each as its
 * recipe-book card with an outlined ⊕ on the trailing edge. Tapping a book adds
 * the recipe to it and closes the sheet.
 */
export function SaveToBookSheet({ open, onOpenChange, recipeId }: SaveToBookSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const primary = theme.primary?.val as string;

  const booksQ = useQuery({
    queryKey: ['feed', 'my-books'],
    queryFn: () => feedApi.myBooks(),
    enabled: open,
  });
  const books = booksQ.data?.items ?? [];
  const add = useAddRecipeToBook();

  const pick = (bookId: string) => {
    if (add.isPending) return;
    add.mutate({ bookId, recipeId }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[72]}>
      <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
        {t('recipe.saveToBookSheet.title')}
      </Text>

      {booksQ.isLoading ? (
        <YStack paddingVertical="$6" alignItems="center">
          <ActivityIndicator color={primary} />
        </YStack>
      ) : books.length === 0 ? (
        <Text color="$textMuted" fontSize={14} textAlign="center" paddingVertical="$5">
          {t('recipe.saveToBookSheet.empty')}
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$3" paddingBottom="$4">
            {books.map((b) => (
              <XStack
                key={b.id}
                alignItems="center"
                gap="$3"
                opacity={add.isPending ? 0.6 : 1}
                style={{ direction: 'ltr' } as never}
              >
                <YStack flex={1}>
                  <BookCard
                    book={toBookCard(b)}
                    width="100%"
                    isFavorited={false}
                    onToggleFavorite={() => {}}
                    onPress={() => pick(b.id)}
                  />
                </YStack>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => pick(b.id)}
                  disabled={add.isPending}
                >
                  <PlusCircle size={30} color={primary} strokeWidth={1.8} />
                </Pressable>
              </XStack>
            ))}
          </YStack>
        </ScrollView>
      )}
    </Sheet>
  );
}
