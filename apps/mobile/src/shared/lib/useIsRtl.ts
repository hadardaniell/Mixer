import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { isRTL } from '@/shared/lib/i18n';

/**
 * Current UI direction flag, derived from the active language.
 *
 * Apply the result via `style={{ direction: isRtl ? 'rtl' : 'ltr' }}` on a
 * row's container to pin its layout direction. Setting `direction` directly on
 * the element is honored by both Yoga (native) and CSS (web), so it doesn't
 * depend on `I18nManager` state — the same approach `AuthHeader` uses.
 */
export function useIsRtl(): boolean {
  const { language } = useLanguage();
  return isRTL(language);
}
