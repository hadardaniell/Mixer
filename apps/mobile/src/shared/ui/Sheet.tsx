import type { ReactNode } from 'react';
import { Sheet as TamaguiSheet } from 'tamagui';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapPoints?: number[];
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, snapPoints = [60], children }: SheetProps) {
  return (
    <TamaguiSheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      dismissOnSnapToBottom
      animation="medium"
    >
      <TamaguiSheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <TamaguiSheet.Handle />
      <TamaguiSheet.Frame padding="$4" gap="$3">
        {children}
      </TamaguiSheet.Frame>
    </TamaguiSheet>
  );
}
