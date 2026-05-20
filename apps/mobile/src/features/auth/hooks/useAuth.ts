import { useAuthContext } from '@/features/auth/context/AuthContext';

export function useAuth() {
  return useAuthContext();
}
