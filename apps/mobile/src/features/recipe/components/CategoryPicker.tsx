import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';

import { categoryLabel, useCategories } from '@/features/categories/hooks/useCategories';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { useIsRtl } from '@/shared/lib/useIsRtl';

interface CategoryPickerProps {
  /** Selected category ids. */
  value: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Multi-select category chips backed by the curated `categories` collection — a
 * recipe can belong to several (e.g. פסטה + צמחוני). Shared by the create
 * wizard's step 2 and the inline meta editor. Selecting toggles membership.
 */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const { language } = useLanguage();
  const { categories } = useCategories();

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <YStack gap="$2" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
      <Text color="$text" fontSize={15} fontWeight="700">
        {t('newRecipe.manual.step2.category')}
      </Text>
      <XStack flexWrap="wrap" gap="$2" alignItems="center">
        {categories.map((c) => {
          const selected = value.includes(c.id);
          return (
            <Text
              key={c.id}
              onPress={() => toggle(c.id)}
              color="$text"
              fontSize={14}
              fontWeight="600"
              paddingVertical={10}
              paddingHorizontal={18}
              borderRadius={999}
              borderWidth={selected ? 0 : 1}
              borderColor={selected ? 'transparent' : '$border'}
              backgroundColor={selected ? '$accentPink' : '$surface'}
              pressStyle={{ opacity: 0.85 }}
            >
              {categoryLabel(c, language)}
            </Text>
          );
        })}
      </XStack>
    </YStack>
  );
}
