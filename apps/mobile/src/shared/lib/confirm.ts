import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Render the confirm action as destructive (native only styles it red). */
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * A confirmation dialog that works on **both** native and web.
 *
 * `Alert.alert` from react-native is a no-op on react-native-web — the dialog
 * simply never appears, so any button gated behind it looks dead (this is why
 * "log out" did nothing in the browser). On web we fall back to the built-in
 * `window.confirm`; on native we keep the nicer two/three-button `Alert`.
 */
export function confirmAction({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
}: ConfirmOptions): void {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined' && window.confirm(text)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
