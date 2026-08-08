import type { ExtractFromTextResult, Recipe, RecipeSourceTypeSchema } from '@mixer/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { feedApi } from '@/features/home/api/feedApi';
import { mapExtraction } from '@/features/recipe/lib/mapExtraction';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { notifyLocally } from '@/shared/lib/localNotify';

type SourceType = z.infer<typeof RecipeSourceTypeSchema>;

export interface ExtractionJob {
  id: string;
  status: 'running' | 'ready' | 'failed';
  sourceType: SourceType;
  /** Set once the recipe exists. */
  recipe?: Pick<Recipe, 'id' | 'title'>;
  /** Translation key for what went wrong, ready to pass to `t()`. */
  errorKey?: string;
  /**
   * Decided once, at the moment the job settled: was anyone watching the cooking
   * screen? False means the cooking screen will navigate straight to the recipe; true
   * means the user walked away and gets the banner instead.
   *
   * It's a value on the job rather than something the banner asks at render time,
   * because "is someone watching" lives in a ref — reading a ref during render isn't
   * reactive, so the banner could appear and then vanish on the next unrelated
   * re-render. Freezing the answer here makes the outcome depend only on state.
   */
  announce?: boolean;
}

interface StartArgs {
  extract: () => Promise<ExtractFromTextResult>;
  sourceType: SourceType;
  sourceUrl?: string;
  /** Maps a thrown error to a translation key. Defaults to the generic extract failure. */
  mapError?: (e: unknown) => string;
}

interface ExtractionJobValue {
  job: ExtractionJob | null;
  /** Kicks off an extraction and returns immediately — the promise lives here, not in a screen. */
  start: (args: StartArgs) => void;
  /** Forget the finished job (after navigating to the recipe, or dismissing the banner). */
  clear: () => void;
  /**
   * Called by the cooking screen while it's on screen. A job that finishes with someone
   * watching gets navigated to directly; only an unwatched one raises a banner.
   */
  setWatching: (watching: boolean) => void;
}

const ExtractionJobContext = createContext<ExtractionJobValue | null>(null);

/**
 * Owns the one in-flight recipe import.
 *
 * The point of hoisting it above the router: an extraction takes 20–60 seconds, and
 * the user shouldn't have to stare at a pot for it. The promise is held here, at the
 * root, so leaving the cooking screen — or the whole create flow — doesn't cancel
 * anything. When it lands, whoever is listening reacts: the cooking screen navigates
 * straight to the recipe, and if nobody is watching, the banner and a device
 * notification take over.
 *
 * Deliberately single-slot. A second import while one is running is rare, and a queue
 * would need its own UI to be honest about what's in it; starting a new job simply
 * replaces the old one's result.
 */
export function ExtractionJobProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [job, setJob] = useState<ExtractionJob | null>(null);
  // A ref, not state: the resolution handler reads this at the moment the promise
  // settles, long after the closure that started it was created.
  const watching = useRef(false);
  const currentId = useRef<string | null>(null);

  const setWatching = useCallback((next: boolean) => {
    watching.current = next;
  }, []);
  const clear = useCallback(() => {
    currentId.current = null;
    setJob(null);
  }, []);

  const start = useCallback(
    ({ extract, sourceType, sourceUrl, mapError }: StartArgs) => {
      const id = `${Date.now()}`;
      currentId.current = id;
      setJob({ id, status: 'running', sourceType });

      void (async () => {
        try {
          const result = await extract();
          const input = mapExtraction(result, language, sourceType, t('newRecipe.title'), sourceUrl);
          const recipe = await feedApi.createRecipe(input);
          // A newer job started while this one was in flight — its result is what the
          // user is waiting on, so drop this one rather than overwrite it.
          if (currentId.current !== id) return;

          // An import lands published, so it belongs in the recipe lists straight away
          // — not only in the drafts pile it used to go to.
          qc.invalidateQueries({ queryKey: ['drafts'] });
          qc.invalidateQueries({ queryKey: ['feed', 'my-recipes'] });
          // Only announce to someone who walked away. Whoever is on the cooking screen
          // is about to be taken to the recipe anyway.
          const announce = !watching.current;
          setJob({
            id,
            status: 'ready',
            sourceType,
            recipe: { id: recipe.id, title: recipe.title },
            announce,
          });

          if (announce) {
            void notifyLocally(t('cooking.ready.title'), t('cooking.ready.body', { title: recipe.title }), {
              recipeId: recipe.id,
            });
          }
        } catch (e) {
          if (currentId.current !== id) return;
          setJob({
            id,
            status: 'failed',
            sourceType,
            errorKey: mapError?.(e) ?? 'newRecipe.errors.extractFailed',
          });
        }
      })();
    },
    [language, t, qc],
  );

  const value = useMemo<ExtractionJobValue>(
    () => ({ job, start, clear, setWatching }),
    [job, start, clear, setWatching],
  );

  return <ExtractionJobContext.Provider value={value}>{children}</ExtractionJobContext.Provider>;
}

export function useExtractionJob(): ExtractionJobValue {
  const ctx = useContext(ExtractionJobContext);
  if (!ctx) throw new Error('useExtractionJob must be used inside ExtractionJobProvider');
  return ctx;
}
