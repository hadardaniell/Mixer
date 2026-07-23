import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, YStack } from 'tamagui';

import { AuthPrimaryButton } from '@/features/auth/components/AuthPrimaryButton';
import { feedApi } from '@/features/home/api/feedApi';
import { CreateFlowHeader } from '@/features/recipe/components/CreateFlowHeader';
import { useCreateFromExtraction } from '@/features/recipe/hooks/useCreateFromExtraction';
import { useLanguage } from '@/features/settings/hooks/useLanguage';
import { HttpError } from '@/shared/lib/httpClient';
import { isRTL } from '@/shared/lib/i18n';
import { ConceptualIcon } from '@/shared/ui/ConceptualIcon';

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

export function CreateFromImageScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRtl = isRTL(language);

  const [image, setImage] = useState<PickedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateFromExtraction();
  const busy = create.isPending;

  const pick = async () => {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (!asset?.base64) return;
    setImage({ uri: asset.uri, base64: asset.base64, mimeType: resolveMime(asset.uri, asset.mimeType) });
  };

  const submit = async () => {
    if (!image || busy) return;
    setError(null);
    try {
      const recipe = await create.mutateAsync({
        extract: () =>
          feedApi.importImage([{ imageBase64: image.base64, mimeType: image.mimeType }]),
        sourceType: 'image',
      });
      router.replace(`/recipes/${recipe.id}` as never);
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

        {/* Drop-zone — tapping opens the native picker directly */}
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
          padding={image ? '$2' : '$4'}
          style={{ borderStyle: 'dashed' }}
          pressStyle={{ backgroundColor: '$bgSubtle' }}
        >
          {image ? (
            <YStack flex={1} width="100%" alignItems="center" justifyContent="center" gap="$2">
              {/* Fill the available height and show the whole photo (no crop) so
                  the user can verify the full recipe is captured. */}
              <Image
                source={{ uri: image.uri }}
                style={{ width: '100%', flex: 1, borderRadius: 16 }}
                resizeMode="contain"
              />
              <Text color="$linkText" fontSize={14} fontWeight="700">
                {t('newRecipe.image.replace')}
              </Text>
            </YStack>
          ) : (
            <>
              <ConceptualIcon Icon={Camera} blobColor="$accentPink" variant={1} size={84} />
              <Text color="$text" fontSize={16} fontWeight="700">
                {t('newRecipe.image.dropzone')}
              </Text>
            </>
          )}
        </YStack>

        {error ? (
          <Text color="$danger" fontSize={13} textAlign="center">
            {error}
          </Text>
        ) : null}

        <AuthPrimaryButton
          label={busy ? t('newRecipe.creating') : t('newRecipe.image.cta')}
          onPress={submit}
          disabled={!image || busy}
        />
    </YStack>
  );
}
