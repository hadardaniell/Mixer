import type { PublicUser, UpdateOwnUserInput } from '@mixer/contracts';

import { http } from '@/shared/lib/httpClient';

export interface UploadableAvatar {
  uri: string;
  name: string;
  type: string;
}

export const settingsApi = {
  me: () => http<PublicUser>('/users/me'),

  updateMe: (input: UpdateOwnUserInput) =>
    http<PublicUser>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  /** Multipart avatar upload; the API stores it in Firebase and returns the updated user. */
  uploadAvatar: (file: UploadableAvatar) => {
    const form = new FormData();
    // React Native's FormData accepts a { uri, name, type } file descriptor.
    form.append('file', file as unknown as Blob);
    return http<PublicUser>('/users/me/avatar', { method: 'POST', body: form });
  },
};
