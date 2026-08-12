import { GoogleOAuthProvider } from '@react-oauth/google';
import type { ReactNode } from 'react';

import { env } from '@/shared/config/env';

export function GoogleProvider({ children }: { children: ReactNode }) {
  const clientId =
    env.googleWebClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    'disabled-google-client-id.apps.googleusercontent.com';

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
