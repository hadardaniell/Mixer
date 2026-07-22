import * as ImagePicker from 'expo-image-picker';
import { ImagePlus } from 'lucide-react-native';
import type { Dispatch } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image } from 'react-native';
import { Text, useTheme, YStack } from 'tamagui';

import { useUploadRecipeImage } from '@/features/recipe/hooks/useUploadRecipeImage';
import { useIsRtl } from '@/shared/lib/useIsRtl';
import type { ManualForm, ManualFormAction } from '@/features/recipe/lib/manualRecipe';

import { ManualTextInput } from './ManualTextInput';
import { StepShell } from './StepShell';

interface Props {
  form: ManualForm;
  dispatch: Dispatch<ManualFormAction>;
}

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
  return `cover.${ext}`;
}

/** Step 1 — recipe name, short description, and a cover photo (pick + upload). */
export function Step1Basics({ form, dispatch }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const muted = theme.textMuted?.val as string;

  const upload = useUploadRecipeImage();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const pickPhoto = async () => {
    if (upload.isPending) return;
    setError(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (!asset?.uri) return;

    setPreview(asset.uri);
    const type = resolveMime(asset.uri, asset.mimeType);
    try {
      const imageUrl = await upload.mutateAsync({
        uri: asset.uri,
        name: asset.fileName ?? fileNameFor(asset.uri, type),
        type,
      });
      dispatch({ type: 'patch', value: { coverImageUrl: imageUrl } });
    } catch {
      setError(true);
      setPreview(null);
    }
  };

  const shownImage = preview ?? form.coverImageUrl;

  return (
    <StepShell step={1} title={t('newRecipe.manual.step1.title')}>
      <YStack gap="$4" style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}>
        <YStack gap="$2">
          <Text color="$text" fontSize={15} fontWeight="700">
            {t('newRecipe.manual.step1.nameLabel')}
          </Text>
          <ManualTextInput
            value={form.title}
            onChangeText={(title) => dispatch({ type: 'patch', value: { title } })}
            placeholder={t('newRecipe.manual.step1.namePlaceholder')}
          />
        </YStack>

        <YStack gap="$2">
          <Text color="$text" fontSize={15} fontWeight="700">
            {t('newRecipe.manual.step1.descLabel')}
          </Text>
          <ManualTextInput
            value={form.description}
            onChangeText={(description) => dispatch({ type: 'patch', value: { description } })}
            placeholder={t('newRecipe.manual.step1.descPlaceholder')}
            multiline
          />
        </YStack>

        <YStack gap="$2">
          <Text color="$text" fontSize={15} fontWeight="700">
            {t('newRecipe.manual.step1.photoLabel')}
          </Text>
          <YStack
            onPress={pickPhoto}
            alignItems="center"
            justifyContent="center"
            gap="$2"
            paddingVertical={shownImage ? 0 : '$5'}
            borderRadius={14}
            borderWidth={1}
            borderColor="$border"
            borderStyle="dashed"
            overflow="hidden"
            pressStyle={{ backgroundColor: '$bgSubtle' }}
          >
            {shownImage ? (
              <>
                <Image
                  source={{ uri: shownImage }}
                  style={{ width: '100%', height: 180 }}
                  resizeMode="cover"
                />
                {upload.isPending ? (
                  <YStack
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    alignItems="center"
                    justifyContent="center"
                    gap="$2"
                    backgroundColor="$overlay"
                  >
                    <ActivityIndicator color={theme.textOnPrimary?.val as string} />
                    <Text color="$textOnPrimary" fontSize={13}>
                      {t('newRecipe.manual.step1.photoUploading')}
                    </Text>
                  </YStack>
                ) : (
                  <Text
                    color="$textMuted"
                    fontSize={13}
                    paddingVertical="$2"
                  >
                    {t('newRecipe.manual.step1.photoChange')}
                  </Text>
                )}
              </>
            ) : (
              <>
                <ImagePlus size={26} color={muted} />
                <Text color="$textMuted" fontSize={13}>
                  {t('newRecipe.manual.step1.photoHint')}
                </Text>
              </>
            )}
          </YStack>
          {error ? (
            <Text color="$danger" fontSize={13}>
              {t('newRecipe.errors.uploadFailed')}
            </Text>
          ) : null}
        </YStack>
      </YStack>
    </StepShell>
  );
}
