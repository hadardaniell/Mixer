import { NotificationsScreen } from '@/features/notifications/screens/NotificationsScreen';
import { AuthGuard } from '@/shared/ui/AuthGuard';

export default function NotificationsRoute() {
  return (
    <AuthGuard>
      <NotificationsScreen />
    </AuthGuard>
  );
}
