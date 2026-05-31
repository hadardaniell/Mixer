import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { env } from '@/shared/config/env';

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: env.googleWebClientId,
    iosClientId: env.googleIosClientId || undefined,
  });
  configured = true;
}

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('cancelled');
    this.name = 'GoogleSignInCancelledError';
  }
}

export async function signInWithGoogle(): Promise<string> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  try {
    const result = await GoogleSignin.signIn();
    const idToken =
      'data' in result ? result.data?.idToken : (result as { idToken?: string }).idToken;
    if (!idToken) throw new Error('Google sign-in did not return an idToken');
    return idToken;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === statusCodes.SIGN_IN_CANCELLED) {
      throw new GoogleSignInCancelledError();
    }
    throw e;
  }
}

export async function signOutGoogle(): Promise<void> {
  if (!configured) return;
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore — best-effort
  }
}
