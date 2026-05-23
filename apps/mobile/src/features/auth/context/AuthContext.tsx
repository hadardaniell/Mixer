import type { AuthResponse, PublicUser } from '@mixer/contracts';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { authApi } from '@/features/auth/services/authApi';
import { tokens } from '@/features/auth/services/tokens';

interface AuthContextValue {
  accessToken: string | null;
  user: PublicUser | null;
  isAuthenticated: boolean;
  signIn: (response: AuthResponse) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

function snapshot() {
  return {
    accessToken: tokens.getAccessToken(),
    user: tokens.getUser(),
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState(snapshot);

  useEffect(() => tokens.subscribe(() => setState(snapshot())), []);

  const signIn = useCallback((response: AuthResponse) => {
    tokens.setSession(response.accessToken, response.refreshToken, response.user);
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = tokens.getRefreshToken();
    tokens.clear();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // best-effort; local session is already cleared
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: state.accessToken,
      user: state.user,
      isAuthenticated: state.accessToken !== null,
      signIn,
      signOut,
    }),
    [state, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}
