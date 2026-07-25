import type { PublicUser, UpdateOwnUserInput } from '@mixer/contracts';

import { http } from '@/shared/lib/httpClient';
import { buildImageFormData, type UploadableFile } from '@/shared/lib/imageFormData';

export type UploadableAvatar = UploadableFile;

export const settingsApi = {
  me: () => http<PublicUser>('/users/me'),

  updateMe: (input: UpdateOwnUserInput) =>
    http<PublicUser>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  /** Multipart avatar upload; the API stores it in Firebase and returns the updated user. */
  uploadAvatar: async (file: UploadableAvatar) => {
    const form = await buildImageFormData(file);
    return http<PublicUser>('/users/me/avatar', { method: 'POST', body: form });
  },
};
