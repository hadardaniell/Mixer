import { useTranslation } from 'react-i18next';
import { Text, View, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import { COVER_COLORS, COVER_ICONS, decodeCover, encodeCover } from '@/shared/ui/BookCoverArt';

interface CoverPickerProps {
  /** Current `coverKey` (`"colorId.iconId"`). */
  value?: string;
  onChange: (coverKey: string) => void;
}

/**
 * The book-cover builder — a row of color swatches and a grid of icons. The
 * choice encodes into a `coverKey`. Shared by the create-book wizard (step 4)
 * and the edit-book sheet so both stay in lock-step.
 */
export function CoverPicker({ value, onChange }: CoverPickerProps) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  const [colorId, iconId] = (value ?? '').split('.');
  const fallback = decodeCover(value);
  const activeColorId = COVER_COLORS.find((c) => c.id === colorId)?.id ?? fallback.color.id;
  const activeIconId = COVER_ICONS.find((i) => i.id === iconId)?.id ?? COVER_ICONS[0]!.id;

  const align = isRtl ? 'right' : 'left';

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Text color="$text" fontSize={15} fontWeight="700" textAlign={align}>
          {t('createBook.step4.colorLabel')}
        </Text>
        <XStack flexWrap="wrap" gap={12}>
          {COVER_COLORS.map((c) => {
            const selected = c.id === activeColorId;
            return (
              <View
                key={c.id}
                width={38}
                height={38}
                borderRadius={999}
                backgroundColor={c.tint}
                borderWidth={selected ? 2.5 : 1}
                borderColor={selected ? '$text' : '$border'}
                onPress={() => onChange(encodeCover(c.id, activeIconId))}
                pressStyle={{ opacity: 0.8 }}
              />
            );
          })}
        </XStack>
      </YStack>

      <YStack gap="$2">
        <Text color="$text" fontSize={15} fontWeight="700" textAlign={align}>
          {t('createBook.step4.iconLabel')}
        </Text>
        <XStack flexWrap="wrap" gap={10}>
          {COVER_ICONS.map(({ id, Icon }) => {
            const selected = id === activeIconId;
            return (
              <View
                key={id}
                width={52}
                height={52}
                borderRadius={14}
                alignItems="center"
                justifyContent="center"
                backgroundColor={selected ? '$primarySubtle' : '$surface'}
                borderWidth={selected ? 0 : 1}
                borderColor="$border"
                onPress={() => onChange(encodeCover(activeColorId, id))}
                pressStyle={{ opacity: 0.8 }}
              >
                <Icon size={24} color={selected ? '#33409E' : '#12121A'} weight="regular" />
              </View>
            );
          })}
        </XStack>
      </YStack>
    </YStack>
  );
}
