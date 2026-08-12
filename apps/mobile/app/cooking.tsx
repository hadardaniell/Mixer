import { CookingScreen } from '@/features/recipe/screens/CookingScreen';
import { AuthGuard } from '@/shared/ui/AuthGuard';

export default function CookingRoute() {
  return (
    <AuthGuard>
      <CookingScreen />
    </AuthGuard>
  );
}
