import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme, XStack, YStack } from 'tamagui';

import { AuthPrimaryButton } from '@/features/auth/components/AuthPrimaryButton';
import { feedApi } from '@/features/home/api/feedApi';
import { CreateFlowHeader } from '@/features/recipe/components/CreateFlowHeader';
import { useCreateFromExtraction } from '@/features/recipe/hooks/useCreateFromExtraction';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { HttpError } from '@/shared/lib/httpClient';
import { isRTL } from '@/shared/lib/i18n';
import { ConceptualIcon } from '@/shared/ui/ConceptualIcon';

const MAX_IMAGES = 6;

type PickedImage = { uri: string; base64: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' };

function resolveMime(uri: string, assetMime?: string): PickedImage['mimeType'] {
  if (assetMime === 'image/png' || assetMime === 'image/webp' || assetMime === 'image/jpeg') {
    return assetMime;
  }
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

// Web-only: resize to max 1024px and compress to JPEG 75%.
// expo-image-picker's quality option is ignored on web, so mobile camera photos
// arrive at full resolution (4–10 MB) and may also have a null base64 field.
// Uses document.createElement('img') to avoid naming conflict with RN's Image import.
function compressForWeb(blobUri: string): Promise<{ base64: string; mimeType: 'image/jpeg' }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (img.width === 0 || img.height === 0) {
        reject(new Error('image has zero dimensions'));
        return;
      }
      const MAX_DIM = 1024;
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no canvas context')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      const base64 = dataUrl.split(',')[1];
      if (!base64) { reject(new Error('canvas export failed')); return; }
      resolve({ base64, mimeType: 'image/jpeg' });
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = blobUri;
  });
}

// Fallback for when canvas fails: read the blob directly via FileReader (no resize).
async function readBlobAsBase64(blobUri: string): Promise<{ base64: string; mimeType: 'image/jpeg' }> {
  const res = await fetch(blobUri);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      if (base64) resolve({ base64, mimeType: 'image/jpeg' });
      else reject(new Error('FileReader returned empty data'));
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

export function CreateFromImageScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isRtl = isRTL(language);

  const [images, setImages] = useState<PickedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateFromExtraction();
  const busy = create.isPending;

  const pick = async () => {
    setError(null);
    // On web the browser's file dialog handles access — no permission API needed.
    // Awaiting anything before launchImageLibraryAsync on web loses the user
    // gesture context and silently prevents the file picker from opening.
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
    }
    // On web, browsers can't enforce a selection count limit, so we use single-select
    // and let the user tap "Add photo" repeatedly. On native the picker enforces selectionLimit.
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      base64: Platform.OS !== 'web',
      quality: 0.5,
      allowsMultipleSelection: Platform.OS !== 'web',
      selectionLimit: Platform.OS !== 'web' ? MAX_IMAGES - images.length : 1,
    });
    if (res.canceled) return;
    const picked: PickedImage[] = (
      await Promise.all(
        res.assets.map(async (a) => {
          if (Platform.OS === 'web') {
            // Try canvas compression first; fall back to raw FileReader if canvas fails.
            try {
              return { uri: a.uri, ...(await compressForWeb(a.uri)) };
            } catch {
              try {
                return { uri: a.uri, ...(await readBlobAsBase64(a.uri)) };
              } catch {
                return null;
              }
            }
          }
          if (!a.base64) return null;
          return { uri: a.uri, base64: a.base64, mimeType: resolveMime(a.uri, a.mimeType) };
        }),
      )
    ).filter((p): p is PickedImage => p !== null);

    if (picked.length === 0 && res.assets.length > 0) {
      setError(t('newRecipe.errors.extractFailed'));
      return;
    }
    setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (images.length === 0 || busy) return;
    setError(null);
    try {
      const recipe = await create.mutateAsync({
        extract: () =>
          feedApi.importImage(
            images.map((img) => ({ imageBase64: img.base64, mimeType: img.mimeType })),
            language,
          ),
        sourceType: 'image',
      });
      router.navigate('/home');
      setTimeout(() => {
        router.push(`/recipes/${recipe.id}` as never);
      }, 0);
    } catch (e) {
      const notSame =
        e instanceof HttpError &&
        (e.body as { message?: string } | undefined)?.message === 'images_not_same_recipe';
      setError(t(notSame ? 'newRecipe.errors.notSameRecipe' : 'newRecipe.errors.extractFailed'));
    }
  };

  return (
    <YStack
      flex={1}
      width="100%"
      paddingHorizontal="$4"
      paddingTop={insets.top + 24}
      paddingBottom={120}
      gap="$4"
      style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
    >
      <CreateFlowHeader
        title={t('newRecipe.image.title')}
        subtitle={t('newRecipe.image.subtitle')}
      />

      {images.length === 0 ? (
        <YStack
          onPress={pick}
          flex={1}
          minHeight={160}
          borderRadius={20}
          borderWidth={2}
          borderColor="$border"
          backgroundColor="$surface"
          alignItems="center"
          justifyContent="center"
          gap="$3"
          padding="$4"
          style={{ borderStyle: 'dashed' }}
          pressStyle={{ backgroundColor: '$bgSubtle' }}
        >
          <ConceptualIcon Icon={Camera} blobColor="$accentPink" variant={1} size={84} />
          <Text color="$text" fontSize={16} fontWeight="700">
            {t('newRecipe.image.dropzone')}
          </Text>
        </YStack>
      ) : (
        <YStack flex={1} gap="$2">
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <XStack flexWrap="wrap" gap="$2">
              {images.map((img, i) => (
                <YStack
                  key={i}
                  width="48%"
                  aspectRatio={1}
                  borderRadius={12}
                  overflow="hidden"
                  backgroundColor="$surface"
                >
                  <Image
                    source={{ uri: img.uri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => removeImage(i)}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      borderRadius: 999,
                      padding: 4,
                    }}
                  >
                    <X size={14} color="white" />
                  </Pressable>
                </YStack>
              ))}

              {images.length < MAX_IMAGES && (
                <YStack
                  onPress={pick}
                  width="48%"
                  aspectRatio={1}
                  borderRadius={12}
                  borderWidth={2}
                  borderColor="$border"
                  backgroundColor="$surface"
                  alignItems="center"
                  justifyContent="center"
                  gap="$1"
                  style={{ borderStyle: 'dashed' }}
                  pressStyle={{ backgroundColor: '$bgSubtle' }}
                >
                  <Plus size={24} color={theme.textMuted?.val as string} />
                  <Text color="$textMuted" fontSize={12}>
                    {t('newRecipe.image.addMore')}
                  </Text>
                </YStack>
              )}
            </XStack>
          </ScrollView>

          <Text color="$textMuted" fontSize={12} textAlign="center">
            {images.length} / {MAX_IMAGES}
          </Text>
        </YStack>
      )}

      {error ? (
        <Text color="$danger" fontSize={13} textAlign="center">
          {error}
        </Text>
      ) : null}

      <AuthPrimaryButton
        label={busy ? t('newRecipe.creating') : t('newRecipe.image.cta')}
        onPress={submit}
        disabled={images.length === 0 || busy}
      />
    </YStack>
  );
}
