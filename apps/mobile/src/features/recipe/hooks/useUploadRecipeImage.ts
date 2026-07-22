import { useMutation } from '@tanstack/react-query';

import { feedApi } from '@/features/home/api/feedApi';

export interface UploadableImage {
  uri: string;
  name: string;
  type: string;
}

/**
 * Uploads a cover image to Firebase Storage (via the API) and resolves to its
 * public URL. The caller stores that URL on the recipe draft. Owns its own
 * pending/error state so screens can show an "uploading…" affordance.
 */
export function useUploadRecipeImage() {
  return useMutation<string, Error, UploadableImage>({
    mutationFn: async (file) => {
      const { imageUrl } = await feedApi.uploadRecipeImage(file);
      return imageUrl;
    },
  });
}
