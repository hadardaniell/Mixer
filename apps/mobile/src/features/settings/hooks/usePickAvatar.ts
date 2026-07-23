import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { useUploadAvatar } from '@/features/settings/hooks/useProfileMutations';

function resolveMime(uri: string, assetMime?: string): string {
  if (assetMime) return assetMime;
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function fileNameFor(uri: string, type: string): string {
  const fromUri = uri.split('/').pop()?.split('?')[0];
  if (fromUri && fromUri.includes('.')) return fromUri;
  const ext = type.split('/')[1] ?? 'jpg';
  return `avatar.${ext}`;
}

/**
 * Pick a square photo from the library and upload it as the account avatar.
 *
 * Exposes an optimistic `preview` uri so the caller can swap the avatar the
 * moment the user picks, before the round-trip to Firebase finishes.
 */
export function usePickAvatar() {
  const upload = useUploadAvatar();
  const [preview, setPreview] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const pick = async () => {
    if (upload.isPending) return;
    setFailed(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (!asset?.uri) return;

    setPreview(asset.uri);
    const type = resolveMime(asset.uri, asset.mimeType);
    try {
      await upload.mutateAsync({
        uri: asset.uri,
        name: asset.fileName ?? fileNameFor(asset.uri, type),
        type,
      });
    } catch {
      setFailed(true);
      setPreview(null);
    }
  };

  return { pick, preview, failed, isUploading: upload.isPending };
}
