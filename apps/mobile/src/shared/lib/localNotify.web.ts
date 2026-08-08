/**
 * Browser counterpart to the native local notification.
 *
 * The Notification API is the closest thing the web has to a device notification, and
 * it only fires once the user has granted permission for the origin. Permission is
 * requested from `ensureNotifyPermission`, which the app calls at the one moment it
 * can be justified — when the user chooses to leave an import running in the
 * background — never on load.
 */

function available(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function notifyLocally(title: string, body: string, data?: Record<string, unknown>) {
  try {
    if (!available() || Notification.permission !== 'granted') return;
    // Tagged so a second finished import replaces the first instead of stacking.
    new Notification(title, { body, tag: 'mixer-recipe-ready', data });
  } catch {
    // Best-effort: the in-app banner is the path that always works.
  }
}

export async function ensureNotifyPermission(): Promise<boolean> {
  try {
    if (!available()) return false;
    if (Notification.permission === 'granted') return true;
    // Safari <16 and older browsers still hand back a callback-only API; the promise
    // form resolves to the same string on everything that supports it.
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}
