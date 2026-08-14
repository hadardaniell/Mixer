import type { Recipe } from '@mixer/contracts';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { Text, YStack } from 'tamagui';

interface RecipeSourceNoteProps {
  recipe: Recipe;
}

function hostnameOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/**
 * The "נוצר מתוך…" attribution line, derived from the recipe's origin:
 *  - forked recipe → generic "from another recipe"
 *  - imported from a URL → the platform name or the link's hostname, followed by the source URL
 * Renders nothing for manually-authored recipes with no traceable source.
 */
export function RecipeSourceNote({ recipe }: RecipeSourceNoteProps) {
  const { t } = useTranslation();

  const isUrlSource = recipe.source?.type === 'url' && !!recipe.source.url;
  const sourceUrl = isUrlSource ? recipe.source.url : undefined;

  let label: string | null = null;
  if (recipe.forkedFrom) {
    label = t('recipe.createdFromRecipe');
  } else if (isUrlSource && sourceUrl) {
    const name = recipe.source.platform ?? hostnameOf(sourceUrl);
    if (name) label = t('recipe.createdFrom', { source: name });
  }

  if (!label && !sourceUrl) return null;

  const handleOpenUrl = () => {
    if (sourceUrl) {
      void Linking.openURL(sourceUrl).catch(() => {});
    }
  };

  return (
    <YStack alignItems="center" gap="$1" paddingVertical="$2">
      {label ? (
        <Text fontSize={13} color="$textSubtle" textAlign="center">
          {label}
        </Text>
      ) : null}

      {sourceUrl ? (
        <Text
          fontSize={13}
          color="$primary"
          textDecorationLine="underline"
          textAlign="center"
          paddingHorizontal="$4"
          onPress={handleOpenUrl}
          pressStyle={{ opacity: 0.7 }}
        >
          {sourceUrl}
        </Text>
      ) : null}
    </YStack>
  );
}

