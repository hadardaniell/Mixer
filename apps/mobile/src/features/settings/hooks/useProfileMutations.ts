import type { PublicUser, UpdateOwnUserInput } from '@mixer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { tokens } from '@/features/auth/services/tokens';
import { settingsApi, type UploadableAvatar } from '@/features/settings/api/settingsApi';

/**
 * The API is the source of truth for the user, but the session copy in MMKV is
 * what most screens read (`useAuth().user`). Every mutation therefore writes the
 * fresh user back into the token store and drops the queries that embed a copy
 * of this user's public profile (avatar + name).
 *
 * `tokens.setUser` re-renders everything reading `useAuth().user` (profile
 * header, home greeting) instantly. But avatars that were resolved through
 * `usersByIds` live in independent caches — the book detail member row, the
 * feed's book-cover avatars — and would keep showing the old photo until they
 * happened to refetch. So we invalidate those namespaces too, and the new
 * avatar propagates everywhere it appears. (The upload always mints a fresh
 * URL, so there's no stale <Image> cache to fight once the data updates.)
 */
function commit(qc: ReturnType<typeof useQueryClient>, user: PublicUser) {
  tokens.setUser(user);
  qc.invalidateQueries({ queryKey: ['profile'] }); // profile lookups + book covers
  qc.invalidateQueries({ queryKey: ['feed'] }); // home feed book-cover avatars
  qc.invalidateQueries({ queryKey: ['book-members'] }); // book detail members
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<PublicUser, Error, UpdateOwnUserInput>({
    mutationFn: (input) => settingsApi.updateMe(input),
    onSuccess: (user) => commit(qc, user),
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation<PublicUser, Error, UploadableAvatar>({
    mutationFn: (file) => settingsApi.uploadAvatar(file),
    onSuccess: (user) => commit(qc, user),
  });
}
