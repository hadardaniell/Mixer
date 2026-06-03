import type { Recipe } from '@mixer/contracts';
import { useTranslation } from 'react-i18next';
import { Text } from 'tamagui';

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
 *  - imported from a URL → the platform name or the link's hostname
 * Renders nothing for manually-authored recipes with no traceable source.
 */
export function RecipeSourceNote({ recipe }: RecipeSourceNoteProps) {
  const { t } = useTranslation();

  let label: string | null = null;
  if (recipe.forkedFrom) {
    label = t('recipe.createdFromRecipe');
  } else if (recipe.source.type === 'url' && recipe.source.url) {
    const name = recipe.source.platform ?? hostnameOf(recipe.source.url);
    if (name) label = t('recipe.createdFrom', { source: name });
  }

  if (!label) return null;

  return (
    <Text fontSize={13} color="$textSubtle" textAlign="center" paddingVertical="$2">
      {label}
    </Text>
  );
}
