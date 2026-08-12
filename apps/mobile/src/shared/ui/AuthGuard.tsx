import { Redirect, type Href } from 'expo-router';
import type { ReactNode } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Renders its children only when the user is authenticated.
 * Redirects to /start otherwise — prevents screens from mounting and
 * firing authenticated API requests before a session exists.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect href={'/start' as Href} />;
  return <>{children}</>;
}
