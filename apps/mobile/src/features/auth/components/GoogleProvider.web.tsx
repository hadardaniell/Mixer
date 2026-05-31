import { GoogleOAuthProvider } from '@react-oauth/google';
import type { ReactNode } from 'react';

import { env } from '@/shared/config/env';

export function GoogleProvider({ children }: { children: ReactNode }) {
  if (!env.googleWebClientId) return <>{children}</>;
  return <GoogleOAuthProvider clientId={env.googleWebClientId}>{children}</GoogleOAuthProvider>;
}
