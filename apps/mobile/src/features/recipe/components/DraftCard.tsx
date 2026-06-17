import type { Recipe } from '@mixer/contracts';
import { useRouter } from 'expo-router';
import { FileText, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { useDeleteRecipe } from '@/features/recipe/hooks/useDeleteRecipe';

const DRAFT_ACCENTS = ['$accentMint', '$accentPink', '$accentPeach', '$accentLavender'] as const;

function pickAccent(id: string): (typeof DRAFT_ACCENTS)[number] {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return DRAFT_ACCENTS[sum % DRAFT_ACCENTS.length]!;
}

function daysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

/**
 * A draft tile: tapping opens the manual wizard in edit mode (the draft's
 * fields pre-filled); the trash icon deletes the draft. Fills its parent's
 * width — the parent controls the cell size.
 */
export function DraftCard({ draft }: { draft: Recipe }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const ink = theme.text?.val as string;
  const del = useDeleteRecipe();

  const openEdit = () => router.push(`/new-recipe/manual?id=${draft.id}` as never);

  return (
    <XStack
      width="100%"
      backgroundColor="$surface"
      borderRadius={18}
      padding="$3"
      gap="$2"
      alignItems="center"
      shadowColor="black"
      shadowOpacity={0.06}
      shadowRadius={14}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={2}
    >
      {/* Tap area → edit. Kept a sibling of the trash button so they never overlap. */}
      <XStack flex={1} onPress={openEdit} alignItems="center" gap="$2" pressStyle={{ opacity: 0.9 }}>
        <YStack
          width={40}
          height={40}
          borderRadius={12}
          backgroundColor={pickAccent(draft.id)}
          alignItems="center"
          justifyContent="center"
        >
          <FileText size={20} color={ink} strokeWidth={1.8} />
        </YStack>

        <YStack flex={1} gap={2}>
          <Text color="$text" fontSize={13} fontWeight="700" numberOfLines={1}>
            {draft.title}
          </Text>
          <Text color="$textMuted" fontSize={11} numberOfLines={1}>
            {t('newRecipe.drafts.updatedDaysAgo', { count: daysAgo(draft.updatedAt) })}
          </Text>
        </YStack>
      </XStack>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('newRecipe.drafts.delete')}
        hitSlop={8}
        disabled={del.isPending}
        onPress={() => del.mutate(draft.id)}
      >
        <Trash2 size={18} color={ink} />
      </Pressable>
    </XStack>
  );
}
