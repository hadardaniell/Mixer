import { CompleteProfileScreen } from '@/features/auth/screens/CompleteProfileScreen';
import { AuthGuard } from '@/shared/ui/AuthGuard';

export default function CompleteProfileRoute() {
  return (
    <AuthGuard>
      <CompleteProfileScreen />
    </AuthGuard>
  );
}
