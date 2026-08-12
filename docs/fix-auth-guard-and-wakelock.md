# fix/auth-guard-and-wakelock

## Overview

Two independent bugs fixed in a single branch:

1. **Auth gap** — protected screens (recipes, settings, friends, etc.) could load without a logged-in user and fire authenticated API requests.
2. **Screen sleep during cooking** — the phone screen would go dark mid-recipe, forcing the user to unlock and find their place again.

---

## Bug 1 — Auth Guard

### Problem

The redirect to `/start` (the login screen) was only defined inside `app/(tabs)/_layout.tsx`.  
That layout only wraps the five tab screens.  
Every other screen in the app had **no protection**:

| Screen | Route |
|---|---|
| Recipe detail | `recipes/[id]` |
| Recipe book detail | `books/[id]` |
| Friend profile | `friends/[id]` |
| Settings | `settings/` |
| Notifications | `notifications` |
| Cooking mode | `cooking` |
| Complete profile | `complete-profile` |

If a user reached any of these (via deep link, push notification, or expired session), the screen would mount and fire authenticated API requests — causing 401 errors, empty states, or data leaks.

### Solution

Created a reusable `AuthGuard` component (`apps/mobile/src/shared/ui/AuthGuard.tsx`):

```tsx
export function AuthGuard({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect href="/start" />;
  return <>{children}</>;
}
```

- Checks the current session **before the screen mounts**
- If no user → redirects to `/start` immediately, no API calls fire
- If user exists → renders children normally

### Where it was applied

**Route groups** — one layout file protects every screen inside the group at once:

- `app/recipes/_layout.tsx` (new) — wraps all `recipes/` screens
- `app/friends/_layout.tsx` (new) — wraps all `friends/` screens  
- `app/books/_layout.tsx` (new) — wraps all `books/` screens
- `app/settings/_layout.tsx` (modified) — wrapped the existing Stack

**Standalone screens** — wrapped individually:

- `app/notifications.tsx`
- `app/cooking.tsx`
- `app/complete-profile.tsx`

---

## Bug 2 — Keep Screen Awake While Cooking

### Problem

While following a recipe step by step, the phone screen would turn off after ~1 minute of inactivity (no tapping). The user would have to unlock the phone and scroll back to find their place.

### Solution

Added a **toggle pill button** in the recipe screen, above the ingredients list.

- Tapping it activates the native screen wake lock via `expo-keep-awake`
- Active state: sun icon highlighted, label "Keep screen on" / "השאר מסך דלוק"
- Inactive state: sun icon dimmed
- When the recipe screen closes the wake lock is automatically released
- Only visible when **not in edit mode** (irrelevant while editing a recipe)

### Files changed

| File | Change |
|---|---|
| `apps/mobile/package.json` | Added `expo-keep-awake ~14.0.3` |
| `apps/mobile/src/features/recipe/screens/RecipeScreen.tsx` | Toggle state, useEffect for wake lock, pill button UI |
| `apps/mobile/src/locales/en.json` | Added `recipe.keepAwake = "Keep screen on"` |
| `apps/mobile/src/locales/he.json` | Added `recipe.keepAwake = "השאר מסך דלוק"` |

### How the wake lock works

```ts
// Only activates when user turns it on — never fires on mount
useEffect(() => {
  if (!keepAwake) return;
  void activateKeepAwakeAsync('recipe-screen');
  return () => { void deactivateKeepAwake('recipe-screen'); };
}, [keepAwake]);
```

The effect is a no-op when `keepAwake` is false, which prevents the "wake lock not activated yet" error on web and on mount.

---

## Files Changed (summary)

```
apps/mobile/src/shared/ui/AuthGuard.tsx          ← new
apps/mobile/app/recipes/_layout.tsx              ← new
apps/mobile/app/friends/_layout.tsx              ← new
apps/mobile/app/books/_layout.tsx                ← new
apps/mobile/app/settings/_layout.tsx             ← modified
apps/mobile/app/notifications.tsx               ← modified
apps/mobile/app/cooking.tsx                      ← modified
apps/mobile/app/complete-profile.tsx             ← modified
apps/mobile/src/features/recipe/screens/RecipeScreen.tsx ← modified
apps/mobile/src/locales/en.json                  ← modified
apps/mobile/src/locales/he.json                  ← modified
apps/mobile/package.json                         ← modified
```

## Testing Checklist

- [ ] Open the app without logging in → all protected screens redirect to `/start`
- [ ] Log in → all screens load normally
- [ ] Open a recipe → no crash on mount
- [ ] Toggle "Keep screen on" → screen stays awake
- [ ] Toggle off or navigate away → screen sleep returns to normal
- [ ] Edit mode → toggle button is not visible
