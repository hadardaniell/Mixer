import { type ReactNode, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { YStack } from 'tamagui';

import { AppSplash } from './AppSplash';

interface SplashGateProps {
  isReady: boolean;
  children: ReactNode;
}

/** Minimum time the splash stays up so its write-on animation always plays. */
const MIN_SPLASH_MS = 2400;
const SESSION_KEY = 'mixer.splashShown';

// Native: a cold start re-imports this module, resetting the flag — so the
// splash shows once per launch. Web: a refresh re-imports too, so we persist in
// sessionStorage to show it once per tab session (not on every dev refresh).
let shownThisRun = false;
function alreadyShown(): boolean {
  if (Platform.OS === 'web') {
    try {
      return globalThis.sessionStorage?.getItem(SESSION_KEY) === '1';
    } catch {
      return shownThisRun;
    }
  }
  return shownThisRun;
}
function markShown(): void {
  shownThisRun = true;
  if (Platform.OS === 'web') {
    try {
      globalThis.sessionStorage?.setItem(SESSION_KEY, '1');
    } catch {
      /* private mode / unavailable — fall back to the in-memory flag */
    }
  }
}

/**
 * Holds the animated launch splash over the app until it has booted and the
 * animation has played, then fades it out. Shown once per launch/session.
 *
 * Children mount only after the write-on finishes — on web there's no separate
 * UI thread, so rendering the app during the animation would jank it; deferring
 * keeps the write smooth, and the app renders while the finished mark holds.
 */
export function SplashGate({ isReady, children }: SplashGateProps) {
  const [skip] = useState(alreadyShown);
  const [minElapsed, setMinElapsed] = useState(false);
  const [written, setWritten] = useState(false);
  const [splashGone, setSplashGone] = useState(false);

  useEffect(() => {
    if (skip) return;
    markShown();
    const id = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(id);
  }, [skip]);

  // Even when we skip the splash animation (a refresh in the same session), the
  // app must not render until it's booted — mounting before i18n is initialized
  // makes react-i18next's useTranslation throw on the ready-state flip.
  if (skip) {
    return <YStack flex={1} backgroundColor="$background">{isReady ? children : null}</YStack>;
  }

  const mountChildren = isReady && written;
  // Only fade out once the write finished (`written`) — the write starts on
  // `isReady`, so on a slow boot we must not fade before it has played.
  const finished = mountChildren && minElapsed;

  return (
    <YStack flex={1} backgroundColor="$background">
      {mountChildren ? children : null}
      {splashGone ? null : (
        <AppSplash
          start={isReady}
          finished={finished}
          onWritten={() => setWritten(true)}
          onHidden={() => setSplashGone(true)}
        />
      )}
    </YStack>
  );
}
