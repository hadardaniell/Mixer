import { PrimaryButton } from '@/shared/ui/PrimaryButton';

interface AuthPrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Kept as a thin alias so existing auth call-sites don't churn. The one primary
 * button lives in `shared/ui/PrimaryButton` — ink fill, white label.
 */
export function AuthPrimaryButton({ label, onPress, disabled }: AuthPrimaryButtonProps) {
  return <PrimaryButton label={label} onPress={onPress} disabled={disabled} />;
}
