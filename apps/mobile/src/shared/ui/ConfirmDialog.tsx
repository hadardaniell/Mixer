//apps/mobile/src/shared/ui/ConfirmDialog.tsx
import { Modal } from 'react-native';
import { Spinner, Text, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Renders the confirm button in danger red (delete, remove, …). */
  destructive?: boolean;
  /** Shows a spinner in the confirm button and blocks re-taps. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * An in-app confirmation dialog — a centered card over a dimmed backdrop, styled
 * like the rest of the app rather than the OS `Alert` (which also doesn't render
 * on web). Controlled: the caller owns `open` and closes it from the handlers.
 *
 * Confirm is the emphasized action (ink, or red when `destructive`); cancel is a
 * quiet bordered button. Both buttons stack full-width so long localized labels
 * never truncate.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isRtl = useIsRtl();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Dimmed backdrop — tapping it cancels, like the OS dialog. */}
      <YStack
        flex={1}
        backgroundColor="$overlay"
        alignItems="center"
        justifyContent="center"
        padding="$5"
        onPress={loading ? undefined : onCancel}
      >
        {/* Card. `onPress` swallows taps so a press inside doesn't dismiss. */}
        <YStack
          width="100%"
          maxWidth={360}
          backgroundColor="$surface"
          borderRadius={20}
          padding="$5"
          gap="$4"
          shadowColor="black"
          shadowOpacity={0.28}
          shadowRadius={14}
          shadowOffset={{ width: 0, height: 6 }}
          elevation={10}
          onPress={(e) => e.stopPropagation()}
          style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
        >
          <YStack gap="$2">
            <Text fontSize={18} fontWeight="700" color="$text" textAlign="center">
              {title}
            </Text>
            {message ? (
              <Text fontSize={14} color="$textMuted" textAlign="center" lineHeight={20}>
                {message}
              </Text>
            ) : null}
          </YStack>

          <YStack gap="$2">
            <YStack
              onPress={loading ? undefined : onConfirm}
              height={52}
              borderRadius={16}
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              gap="$2"
              backgroundColor={destructive ? '$danger' : '$buttonPrimaryBg'}
              opacity={loading ? 0.6 : 1}
              pressStyle={{ opacity: 0.85 }}
            >
              {loading ? <Spinner size="small" color="#FFFFFF" /> : null}
              <Text color="#FFFFFF" fontSize={16} fontWeight="700">
                {confirmLabel}
              </Text>
            </YStack>

            <YStack
              onPress={loading ? undefined : onCancel}
              height={52}
              borderRadius={16}
              alignItems="center"
              justifyContent="center"
              backgroundColor="$surface"
              borderWidth={1}
              borderColor="$border"
              pressStyle={{ backgroundColor: '$bgSubtle' }}
            >
              <Text color="$text" fontSize={16} fontWeight="600">
                {cancelLabel}
              </Text>
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
