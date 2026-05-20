import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { storage, StorageKeys } from '@/shared/config/storage';

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(
    () => storage.getString(StorageKeys.authToken) ?? null,
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = storage.getString(StorageKeys.authUser);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });

  const signIn = useCallback((nextToken: string, nextUser: AuthUser) => {
    storage.set(StorageKeys.authToken, nextToken);
    storage.set(StorageKeys.authUser, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    storage.delete(StorageKeys.authToken);
    storage.delete(StorageKeys.authUser);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isAuthenticated: token !== null, signIn, signOut }),
    [token, user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}
