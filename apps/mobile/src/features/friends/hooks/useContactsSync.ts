import * as Contacts from 'expo-contacts';
import { useCallback, useState } from 'react';

import { friendsApi, type MatchedContact } from '@/features/friends/api/friendsApi';
import { toE164Batch } from '@/features/friends/lib/phone';

type Status = 'idle' | 'requesting' | 'loading' | 'ready' | 'denied' | 'error';

interface ContactsSync {
  status: Status;
  matches: MatchedContact[];
  /** Runs the whole flow: permission → read contacts → normalize → match. */
  sync: () => Promise<void>;
}

/**
 * "Contacts on Mixer" flow. Kept out of the screen so the permission +
 * contact-reading + normalization sequence lives in one testable place.
 *
 * Deliberately does not auto-run on mount — reading contacts is sensitive, so
 * it fires only when the user taps the connect button.
 */
export function useContactsSync(): ContactsSync {
  const [status, setStatus] = useState<Status>('idle');
  const [matches, setMatches] = useState<MatchedContact[]>([]);

  const sync = useCallback(async () => {
    try {
      setStatus('requesting');
      const perm = await Contacts.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        setStatus('denied');
        return;
      }

      setStatus('loading');
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      const raw = data.flatMap((c) => c.phoneNumbers?.map((p) => p.number ?? '') ?? []);
      const numbers = toE164Batch(raw.filter(Boolean));
      if (numbers.length === 0) {
        setMatches([]);
        setStatus('ready');
        return;
      }

      const { users } = await friendsApi.syncContacts(numbers);
      setMatches(users);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  return { status, matches, sync };
}
