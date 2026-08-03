import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { storage, StorageKeys } from '@/shared/config/storage';
import { http } from '@/shared/lib/httpClient';

// Show notifications as banners even when the app is in the foreground.
// Module-level so it runs once before any notification can arrive.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getOrCreateDeviceId(): string {
  const existing = storage.getString(StorageKeys.deviceId);
  if (existing) return existing;
  const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  storage.set(StorageKeys.deviceId, id);
  return id;
}

/**
 * Requests push notification permission and registers the device's Expo push
 * token with the API. Runs once when the user enters the authenticated area.
 * Silently no-ops on simulators — Expo push tokens only work on physical devices.
 */
export function usePushTokenRegistration(): void {
  useEffect(() => {
    // Expo push tokens are not available in simulators/emulators.
    if (!Device.isDevice) return;

    void (async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;

        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        // User declined — respect their choice, don't retry or nag.
        if (finalStatus !== 'granted') return;

        const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } })?.eas?.projectId;
        if (!projectId) return;

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

        await http('/users/me/push-token', {
          method: 'PUT',
          body: JSON.stringify({
            token,
            deviceId: getOrCreateDeviceId(),
            platform: Platform.OS as 'ios' | 'android',
          }),
        });
      } catch {
        // Push registration is best-effort — a failure must never affect the rest of the app.
      }
    })();
  }, []);
}
