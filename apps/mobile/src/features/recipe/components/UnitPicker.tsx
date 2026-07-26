import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { Text, useTheme, View, XStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';
import { Sheet } from '@/shared/ui/Sheet';

import { MEASUREMENT_UNITS } from '../lib/units';

interface UnitPickerProps {
  value?: string;
  onChange: (unit: string | undefined) => void;
  /** Layout style from the parent row (e.g. `{ flex: 1 }`). */
  style?: StyleProp<ViewStyle>;
}

/**
 * A dropdown-style field for choosing an ingredient's unit from the fixed
 * {@link MEASUREMENT_UNITS} table, replacing free-text entry. Because every
 * option is spelled the way the server's conversion expects, a unit picked here
 * is always convertible on the recipe page (when the ingredient is recognized).
 * Styled to match `ManualTextInput` so it sits inline with the other fields.
 */
export function UnitPicker({ value, onChange, style }: UnitPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const [open, setOpen] = useState(false);
  const muted = theme.textMuted?.val as string;

  const choose = (unit: string | undefined) => {
    onChange(unit);
    setOpen(false);
  };

  return (
    <>
      <View
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        backgroundColor="$surface"
        borderWidth={1}
        borderColor="$border"
        borderRadius={14}
        paddingHorizontal={14}
        minHeight={50}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        gap={6}
        pressStyle={{ backgroundColor: '$bgSubtle' }}
        style={style}
      >
        <Text
          fontSize={15}
          color={value ? '$text' : '$textMuted'}
          numberOfLines={1}
          flex={1}
          textAlign={isRtl ? 'right' : 'left'}
        >
          {value || t('newRecipe.manual.step3.unitPlaceholder')}
        </Text>
        <ChevronDown size={16} color={muted} />
      </View>

      <Sheet open={open} onOpenChange={setOpen} snapPoints={[55]}>
        <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
          {t('recipe.units.title')}
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <XStack
            flexWrap="wrap"
            gap="$2"
            paddingBottom="$4"
            justifyContent="center"
            style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
          >
            <UnitChip label={t('recipe.units.none')} active={!value} onPress={() => choose(undefined)} />
            {MEASUREMENT_UNITS.map((u) => (
              <UnitChip
                key={u.value}
                label={u.label}
                active={value === u.value}
                onPress={() => choose(u.value)}
              />
            ))}
          </XStack>
        </ScrollView>
      </Sheet>
    </>
  );
}

function UnitChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      color={active ? '$textOnPrimary' : '$text'}
      fontSize={15}
      fontWeight="600"
      paddingVertical={10}
      paddingHorizontal={18}
      borderRadius={999}
      borderWidth={active ? 0 : 1}
      borderColor="$border"
      backgroundColor={active ? '$tintPeriwinkle' : '$surface'}
      pressStyle={{ opacity: 0.8 }}
    >
      {label}
    </Text>
  );
}
