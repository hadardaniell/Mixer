import type { PublicUser, UpdateOwnUserInput } from '@mixer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { tokens } from '@/features/auth/services/tokens';
import { settingsApi, type UploadableAvatar } from '@/features/settings/api/settingsApi';

/**
 * The API is the source of truth for the user, but the session copy in MMKV is
 * what most screens read (`useAuth().user`). Every mutation therefore writes the
 * fresh user back into the token store and drops the profile queries.
 */
function commit(qc: ReturnType<typeof useQueryClient>, user: PublicUser) {
  tokens.setUser(user);
  qc.invalidateQueries({ queryKey: ['profile'] });
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
