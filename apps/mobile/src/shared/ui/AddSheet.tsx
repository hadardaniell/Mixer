import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, type ImageSourcePropType } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import { Sheet } from '@/shared/ui/Sheet';

const RECIPE_ICON = require('../../assets/images/conceptual-icons/recipe icon.png');
const BOOK_ICON = require('../../assets/images/conceptual-icons/recipe book icon.png');

interface AddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom sheet opened by the navbar "+": two choices — create a recipe or a
 * recipe book. Each row is an icon + title that hugs the start edge (right in
 * RTL, left in LTR).
 */
export function AddSheet({ open, onOpenChange }: AddSheetProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const go = (path: string) => {
    onOpenChange(false);
    router.push(path as never);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[42]}>
      <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
        {t('add.title')}
      </Text>
      <YStack gap="$3">
        <AddOption
          image={RECIPE_ICON}
          title={t('add.newRecipe')}
          desc={t('add.newRecipeDesc')}
          onPress={() => go('/new-recipe')}
        />
        <AddOption
          image={BOOK_ICON}
          title={t('add.newBook')}
          desc={t('add.newBookDesc')}
          onPress={() => go('/books/new')}
        />
      </YStack>
    </Sheet>
  );
}

function AddOption({
  image,
  title,
  desc,
  onPress,
}: {
  image: ImageSourcePropType;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  const isRtl = useIsRtl();
  return (
    <XStack
      onPress={onPress}
      alignItems="center"
      gap="$3"
      padding="$3"
      borderRadius={18}
      backgroundColor="$surface"
      borderWidth={1}
      borderColor="$border"
      pressStyle={{ backgroundColor: '$bgSubtle' }}
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      <Image source={image} style={{ width: 52, height: 52 }} resizeMode="contain" />
      <YStack flex={1} gap={2}>
        <Text color="$text" fontSize={16} fontWeight="700" textAlign={isRtl ? 'right' : 'left'}>
          {title}
        </Text>
        <Text color="$textMuted" fontSize={13} textAlign={isRtl ? 'right' : 'left'}>
          {desc}
        </Text>
      </YStack>
    </XStack>
  );
}
