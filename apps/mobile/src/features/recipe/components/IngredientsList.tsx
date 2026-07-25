import type { Recipe } from '@mixer/contracts';
import { ArrowLeftRight, Check, Minus, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Spinner, Text, useTheme, View, XStack, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

import { convertUnit } from '../api/convertApi';
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

/** Target units we probe the server for, minus whatever matches the row's own
 *  unit. Only the ones the server can actually convert to are shown. */
const CONVERT_TARGETS = ['גרם', 'מ"ל', 'כוסות', 'כפות', 'כפיות'];

/** Loose unit-equality so we don't offer "כוסות" when the row is already "כוס". */
const UNIT_SYNONYMS: string[][] = [
  ['גרם', 'גרמים', 'ג', 'גר'],
  ['מ"ל', 'מל', 'מ״ל'],
  ['כוס', 'כוסות'],
  ['כף', 'כפות'],
  ['כפית', 'כפיות'],
];
function sameUnit(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const x = a.trim();
  const y = b.trim();
  if (x === y) return true;
  return UNIT_SYNONYMS.some((g) => g.includes(x) && g.includes(y));
}

/** A representative target to test whether an ingredient is convertible at all —
 *  grams works for almost everything the server knows; if the row is already in
 *  grams, cups is the fallback probe. */
function probeTarget(unit: string): string {
  return sameUnit('גרם', unit) ? 'כוסות' : 'גרם';
}

type ConvertOption = { unit: string; base: number };
type OptionState = ConvertOption[] | 'loading' | 'none';

/**
 * The "מצרכים" card: a servings stepper that scales ingredient amounts, plus a
 * tappable checkbox list (checked items dim + strike through).
 *
 * Each amount+unit row also carries a ⇄ button: tapping it asks the server which
 * units this specific ingredient converts to (grams, cups, tbsp…) and shows them
 * inline, so the row can be switched to a different unit. Conversions run on the
 * base amount and scale with the multiplier, so no re-fetch on serving changes.
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

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [optionsByIndex, setOptionsByIndex] = useState<Record<number, OptionState>>({});
  const [selected, setSelected] = useState<Record<number, string>>({});
  // Which rows the server can actually convert — the ⇄ button only shows for
  // those, so recognized ingredients get the affordance and everything else
  // stays a plain row (no dead-end taps). One cached probe per amount+unit row.
  const [convertibleRows, setConvertibleRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    ingredients.forEach((ing, index) => {
      if (ing.amount == null || !ing.unit) return;
      void convertUnit(ing.name, ing.amount, ing.unit, probeTarget(ing.unit)).then((base) => {
        if (!cancelled && base != null) {
          setConvertibleRows((prev) => (prev[index] ? prev : { ...prev, [index]: true }));
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [ingredients]);

  const fetchOptions = async (index: number, ing: Recipe['ingredients'][number]) => {
    setOptionsByIndex((prev) => ({ ...prev, [index]: 'loading' }));
    const targets = CONVERT_TARGETS.filter((u) => !sameUnit(u, ing.unit));
    const results = await Promise.all(
      targets.map(async (u) => {
        const base = await convertUnit(ing.name, ing.amount as number, ing.unit as string, u);
        return base != null ? { unit: u, base } : null;
      }),
    );
    const opts = results.filter((r): r is ConvertOption => r != null);
    setOptionsByIndex((prev) => ({ ...prev, [index]: opts.length > 0 ? opts : 'none' }));
  };

  const toggleConvert = (index: number, ing: Recipe['ingredients'][number]) => {
    setOpenIndex((cur) => (cur === index ? null : index));
    if (optionsByIndex[index] === undefined) void fetchOptions(index, ing);
  };

  const select = (index: number, unit: string | null) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (unit) next[index] = unit;
      else delete next[index];
      return next;
    });
    setOpenIndex(null);
  };

  return (
    <YStack
      backgroundColor="$surface"
      borderRadius={20}
      paddingHorizontal="$4"
      paddingTop="$3"
      paddingBottom="$3"
      gap="$2"
      shadowColor="black"
      shadowOpacity={0.28}
      shadowRadius={14}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={10}
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

        <Text fontSize={20} fontWeight="700" letterSpacing={-0.6} color="$text" textAlign="right">
          {t('recipe.ingredients')}
        </Text>
      </XStack>

      <YStack>
        {ingredients.map((ingredient, index) => {
          const isChecked = checked.has(index);
          const opts = optionsByIndex[index];
          const sel = selected[index];
          const convertible = convertibleRows[index] === true;

          let label: string;
          if (sel && Array.isArray(opts)) {
            const o = opts.find((x) => x.unit === sel);
            label = [o ? formatAmount(o.base * multiplier) : '', sel, ingredient.name]
              .filter(Boolean)
              .join(' ');
          } else {
            const amount =
              ingredient.amount != null ? formatAmount(ingredient.amount * multiplier) : undefined;
            label = [amount, ingredient.unit, ingredient.name].filter(Boolean).join(' ');
          }

          const textColor = isChecked ? '$textSubtle' : sel ? '$textOnPrimary' : '$text';

          return (
            <YStack key={index}>
              <XStack
                alignItems="center"
                gap="$2"
                paddingVertical={7}
                flexDirection="row"
                style={{ direction: 'ltr' } as never}
                onPress={() => onToggle(index)}
                pressStyle={{ opacity: 0.7 }}
              >
                {/* ⇄ pinned to the far (left) end of the row; the checkbox stays
                    on the right, the label fills the middle. */}
                {convertible ? (
                  <ConvertButton
                    active={openIndex === index}
                    onPress={() => toggleConvert(index, ingredient)}
                    label={t('recipe.convert.label')}
                  />
                ) : null}
                <Text
                  flex={1}
                  fontSize={13}
                  color={textColor}
                  fontWeight={sel ? '600' : '400'}
                  textDecorationLine={isChecked ? 'line-through' : 'none'}
                  textAlign={isRtl ? 'right' : 'left'}
                  numberOfLines={1}
                  style={
                    {
                      direction: isRtl ? 'rtl' : 'ltr',
                      writingDirection: isRtl ? 'rtl' : 'ltr',
                    } as never
                  }
                >
                  {label}
                </Text>
                <Checkbox checked={isChecked} />
              </XStack>

              {openIndex === index ? (
                <ConvertOptions
                  state={opts}
                  selected={sel}
                  multiplier={multiplier}
                  onSelect={(u) => select(index, u)}
                />
              ) : null}

              {index < ingredients.length - 1 ? <Divider /> : null}
            </YStack>
          );
        })}
      </YStack>
    </YStack>
  );
}

/** The ⇄ disc that opens a row's unit options. */
function ConvertButton({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  const theme = useTheme();
  // RN Pressable (not a Tamagui onPress) so the tap is captured here and does
  // not also toggle the row's checkbox underneath it.
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      <View
        width={30}
        height={30}
        borderRadius={999}
        borderWidth={1}
        borderColor={active ? 'transparent' : '$border'}
        backgroundColor={active ? '$primarySubtle' : '$surface'}
        alignItems="center"
        justifyContent="center"
        pressStyle={{ opacity: 0.6 }}
      >
        <ArrowLeftRight size={15} color={theme.primary?.val as string} />
      </View>
    </Pressable>
  );
}

/** Inline row of unit chips shown under an expanded ingredient. */
function ConvertOptions({
  state,
  selected,
  multiplier,
  onSelect,
}: {
  state: OptionState | undefined;
  selected?: string;
  multiplier: number;
  onSelect: (unit: string | null) => void;
}) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  if (state === 'loading') {
    return (
      <XStack paddingVertical={8} paddingHorizontal={2}>
        <Spinner size="small" color="$primary" />
      </XStack>
    );
  }
  if (!state || state === 'none') {
    return (
      <Text fontSize={12} color="$textSubtle" paddingVertical={8} paddingHorizontal={2}>
        {t('recipe.convert.none')}
      </Text>
    );
  }

  return (
    <XStack
      flexWrap="wrap"
      gap="$2"
      paddingVertical={8}
      paddingHorizontal={2}
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      <Chip label={t('recipe.convert.original')} active={!selected} onPress={() => onSelect(null)} />
      {state.map((o) => (
        <Chip
          key={o.unit}
          label={`${formatAmount(o.base * multiplier)} ${o.unit}`}
          active={selected === o.unit}
          onPress={() => onSelect(o.unit)}
        />
      ))}
    </XStack>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const isRtl = useIsRtl();
  return (
    <View
      onPress={onPress}
      accessibilityRole="button"
      paddingHorizontal={12}
      paddingVertical={6}
      borderRadius={999}
      borderWidth={active ? 0 : 1}
      borderColor="$border"
      backgroundColor={active ? '$tintPeriwinkle' : '$surface'}
      pressStyle={{ opacity: 0.7 }}
    >
      <Text
        fontSize={12}
        fontWeight="600"
        color={active ? '$textOnPrimary' : '$text'}
        style={
          { direction: isRtl ? 'rtl' : 'ltr', writingDirection: isRtl ? 'rtl' : 'ltr' } as never
        }
      >
        {label}
      </Text>
    </View>
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

/**
 * Ticking an ingredient is a *selection* state, which is one of the brand
 * color's sanctioned uses — so the fill is `$primary` rather than the teal it
 * used to be. `$primary` is 3.0:1 on white, fine for a filled shape, and the
 * check itself is a graphic rather than text.
 */
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View
      width={24}
      height={24}
      borderRadius={999}
      alignItems="center"
      justifyContent="center"
      borderWidth={checked ? 0 : 1.5}
      borderColor={checked ? '$primary' : '$gray6'}
      backgroundColor={checked ? '$primary' : 'transparent'}
    >
      {checked ? <Check size={15} color="#FFFFFF" strokeWidth={3} /> : null}
    </View>
  );
}

function Divider() {
  return (
    <View height={1} borderTopWidth={1} borderColor="$gray4" borderStyle="dashed" opacity={0.9} />
  );
}
