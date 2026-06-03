import type { Recipe } from '@mixer/contracts';
import { Check, Minus, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

import {
  canStepMultiplier,
  formatAmount,
  formatQuantityLabel,
  stepMultiplier,
} from '../lib/quantity';

interface IngredientsListProps {
  ingredients: Recipe['ingredients'];
  /** Quantity multiplier — the recipe's authored amounts are "כמות 1" (×1). */
  multiplier: number;
  onMultiplierChange: (next: number) => void;
  checked: Set<number>;
  onToggle: (index: number) => void;
}

/**
 * The "מצרכים" card: a servings stepper that scales ingredient amounts, plus a
 * tappable checkbox list (checked items dim + strike through).
 */
export function IngredientsList({
  ingredients,
  multiplier,
  onMultiplierChange,
  checked,
  onToggle,
}: IngredientsListProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;

  return (
    <YStack
      backgroundColor="$surface"
      borderRadius={20}
      paddingHorizontal="$4"
      paddingTop="$3"
      paddingBottom="$3"
      gap="$2"
      shadowColor="black"
      shadowOpacity={0.08}
      shadowRadius={18}
      shadowOffset={{ width: 0, height: 8 }}
      elevation={4}
    >
      <XStack
        alignItems="center"
        justifyContent="space-between"
        gap="$2"
        flexDirection="row"
        style={{ direction: 'ltr' } as never}
      >
        <XStack alignItems="center" gap="$2" alignSelf="flex-start" flexDirection="row">
          <StepperButton
            onPress={() => onMultiplierChange(stepMultiplier(multiplier, -1))}
            disabled={!canStepMultiplier(multiplier, -1)}
          >
            <Minus size={16} color={ink} />
          </StepperButton>
          <Text fontSize={13} fontWeight="600" color="$text" minWidth={74} textAlign="center">
            {formatQuantityLabel(multiplier, t)}
          </Text>
          <StepperButton
            onPress={() => onMultiplierChange(stepMultiplier(multiplier, 1))}
            disabled={!canStepMultiplier(multiplier, 1)}
          >
            <Plus size={16} color={ink} />
          </StepperButton>
        </XStack>

        <Text fontSize={17} fontWeight="700" color="$text" textAlign="right">
          {t('recipe.ingredients')}
        </Text>
      </XStack>

      <YStack>
        {ingredients.map((ingredient, index) => {
          const isChecked = checked.has(index);
          const amount =
            ingredient.amount != null ? formatAmount(ingredient.amount * multiplier) : undefined;
          const label = [amount, ingredient.unit, ingredient.name].filter(Boolean).join(' ');

          return (
            <YStack key={index}>
              <XStack
                alignItems="center"
                gap="$3"
                paddingVertical={7}
                flexDirection="row"
                style={{ direction: 'ltr' } as never}
                onPress={() => onToggle(index)}
                pressStyle={{ opacity: 0.7 }}
              >
                <Text
                  flex={1}
                  fontSize={13}
                  color={isChecked ? '$textSubtle' : '$text'}
                  textDecorationLine={isChecked ? 'line-through' : 'none'}
                  textAlign={isRtl ? 'right' : 'left'}
                  numberOfLines={1}
                >
                  {label}
                </Text>
                <Checkbox checked={isChecked} />
              </XStack>
              {index < ingredients.length - 1 ? <Divider /> : null}
            </YStack>
          );
        })}
      </YStack>
    </YStack>
  );
}

function StepperButton({
  onPress,
  disabled,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <View
      onPress={disabled ? undefined : onPress}
      width={32}
      height={32}
      borderRadius={999}
      borderWidth={1}
      borderColor="$gray5"
      backgroundColor="$surface"
      alignItems="center"
      justifyContent="center"
      opacity={disabled ? 0.4 : 1}
      pressStyle={{ backgroundColor: '$bgSubtle' }}
    >
      {children}
    </View>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View
      width={24}
      height={24}
      borderRadius={999}
      alignItems="center"
      justifyContent="center"
      borderWidth={checked ? 0 : 1.5}
      borderColor={checked ? '$accentTeal' : '$gray6'}
      backgroundColor={checked ? '$accentTeal' : 'transparent'}
    >
      {checked ? <Check size={15} color="#FFFFFF" /> : null}
    </View>
  );
}

function Divider() {
  return (
    <View height={1} borderTopWidth={1} borderColor="$gray4" borderStyle="dashed" opacity={0.9} />
  );
}
