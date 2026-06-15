import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';

import { BookCard } from '@/shared/ui/BookCard';

import type { BookForm } from '../lib/bookForm';

/** Live preview of the book as it will appear in the feed, from the wizard form. */
export function BookPreviewCard({ form }: { form: BookForm }) {
  const { t } = useTranslation();
  return (
    <YStack alignItems="center">
      <BookCard
        book={{
          id: 'preview',
          name: form.name.trim() || t('createBook.preview.namePlaceholder'),
          recipeCount: form.recipeIds.length,
          coverKey: form.coverKey,
          members: [],
        }}
        isFavorited={false}
        onToggleFavorite={() => {}}
        onPress={() => {}}
      />
    </YStack>
  );
}
