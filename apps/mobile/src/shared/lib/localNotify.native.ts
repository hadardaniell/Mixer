import * as Notifications from 'expo-notifications';

/**
 * Fires a notification from the device itself — no server round-trip.
 *
 * Used when a background import finishes: the work happens on this device, so the
 * device is also what announces it. `trigger: null` means "now", which the OS still
 * renders as a real banner when the app is backgrounded.
 *
 * Best-effort by design. A denied permission or an unavailable notification service
 * must never surface as an error — the in-app banner already covers the case where
 * the user is looking at the app.
 */
export async function notifyLocally(title: string, body: string, data?: Record<string, unknown>) {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
  } catch {
    // Silent on purpose — see above.
  }
}

/**
 * Asks for notification permission at a moment the user has earned an explanation:
 * they just chose to leave a job running in the background. Returns whether we may
 * notify. Never throws.
 */
export async function ensureNotifyPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.status === 'granted';
  } catch {
    return false;
  }
}
