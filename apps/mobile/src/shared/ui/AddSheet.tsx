import { useRouter } from 'expo-router';
import { BookPlus, CookingPot, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import { ConceptualIcon } from '@/shared/ui/ConceptualIcon';
import { Sheet } from '@/shared/ui/Sheet';

interface AddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom sheet opened by the navbar "+": two choices — create a recipe or a
 * recipe book. Each row leads with a conceptual icon (line glyph + colored blob,
 * the mood-board style), not a bitmap and not an ink disc.
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
          Icon={CookingPot}
          blobColor="$accentMint"
          variant={0}
          title={t('add.newRecipe')}
          desc={t('add.newRecipeDesc')}
          onPress={() => go('/new-recipe')}
        />
        <AddOption
          Icon={BookPlus}
          blobColor="$accentLavender"
          variant={2}
          title={t('add.newBook')}
          desc={t('add.newBookDesc')}
          onPress={() => go('/books/new')}
        />
      </YStack>
    </Sheet>
  );
}

function AddOption({
  Icon,
  blobColor,
  variant,
  title,
  desc,
  onPress,
}: {
  Icon: LucideIcon;
  blobColor: string;
  variant: number;
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
      <ConceptualIcon Icon={Icon} blobColor={blobColor} variant={variant} size={52} />
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
