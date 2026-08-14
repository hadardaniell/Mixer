import type { Recipe } from '@mixer/contracts';
import * as Clipboard from 'expo-clipboard';
import { ExternalLink } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { Text, useTheme, XStack, YStack } from 'tamagui';

interface RecipeSourceNoteProps {
  recipe: Recipe;
}

/**
 * The readable name of a source URL: its hostname, without `www.`.
 *
 * Only ever used in the quiet attribution line — the full URL is never rendered.
 * A path is machine text (percent-encoding turns a non-Latin slug into three
 * unreadable lines), and the recipe's own title already says what the page was
 * about. The hostname is the part a person recognises.
 */
function hostnameOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/** How long the button confirms a copy before returning to its label. */
const COPIED_DWELL_MS = 1600;

/**
 * The attribution under a recipe, derived from its origin:
 *  - forked recipe → a plain "from another recipe" line
 *  - imported from a URL → a quiet line naming the source, over a button that opens it
 *
 * The button is outlined rather than ink on purpose: ink is reserved for primary
 * actions (save, create, confirm), and visiting the original is an aside, not the
 * point of the screen. Long-press copies the full URL, so the address stays
 * reachable without being on display.
 *
 * Renders nothing for manually-authored recipes with no traceable source.
 */
export function RecipeSourceNote({ recipe }: RecipeSourceNoteProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  const isUrlSource = recipe.source?.type === 'url' && !!recipe.source.url;
  const sourceUrl = isUrlSource ? recipe.source.url : undefined;

  if (recipe.forkedFrom) {
    return (
      <YStack alignItems="center" paddingVertical="$2">
        <Text fontSize={13} color="$textSubtle" textAlign="center">
          {t('recipe.createdFromRecipe')}
        </Text>
      </YStack>
    );
  }

  if (!sourceUrl) return null;

  // The platform name when the importer recorded one (Instagram, TikTok),
  // otherwise the hostname. Neither is essential — the button stands on its own
  // if the URL won't even parse.
  const name = recipe.source?.platform ?? hostnameOf(sourceUrl);

  const openUrl = () => {
    void Linking.openURL(sourceUrl).catch(() => {});
  };

  const copyUrl = () => {
    void Clipboard.setStringAsync(sourceUrl)
      .then(() => {
        setCopied(true);
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(false), COPIED_DWELL_MS);
      })
      .catch(() => {});
  };

  return (
    <YStack gap="$2" paddingVertical="$2">
      {name ? (
        <Text fontSize={13} color="$textSubtle" textAlign="center">
          {t('recipe.createdFrom', { source: name })}
        </Text>
      ) : null}

      <XStack
        alignItems="center"
        justifyContent="center"
        gap="$2"
        height={48}
        borderRadius={20}
        borderWidth={1}
        borderColor="$border"
        backgroundColor="$surface"
        pressStyle={{ backgroundColor: '$bgSubtle' }}
        onPress={openUrl}
        onLongPress={copyUrl}
        role="link"
        // Names the destination, not the address: reading a percent-encoded URL
        // aloud is unusable, and the hostname is what identifies it anyway.
        aria-label={name ? `${t('recipe.openSource')}, ${name}` : t('recipe.openSource')}
      >
        <ExternalLink size={18} color={theme.linkText?.val as string} />
        <Text fontSize={15} fontWeight="600" color="$linkText">
          {copied ? t('share.sheet.copied') : t('recipe.openSource')}
        </Text>
      </XStack>
    </YStack>
  );
}
