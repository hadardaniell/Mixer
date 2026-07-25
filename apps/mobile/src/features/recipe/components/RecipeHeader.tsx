import type { Recipe } from '@mixer/contracts';
import { ArrowRight, ImagePlus, Pencil, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Platform, Pressable, TextInput } from 'react-native';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { FavoriteButton } from '@/shared/ui/FavoriteButton';
import { useIsRtl } from '@/shared/lib/useIsRtl';

import { RecipeMetaTags } from './RecipeMetaTags';

const INPUT_FONT = Platform.select({ web: 'Rubik', default: 'Rubik_400Regular' });

interface RecipeHeaderProps {
  recipe: Recipe;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
  /** Whether the current user owns this recipe (shows the edit pencil). */
  canEdit?: boolean;
  /** Inline edit mode — renders the title/description/cover as inputs. */
  editing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  /** Edited values (only used while `editing`). */
  editTitle?: string;
  editDescription?: string;
  editCoverImageUrl?: string;
  onChangeTitle?: (v: string) => void;
  onChangeDescription?: (v: string) => void;
  onPickImage?: () => void;
  imageUploading?: boolean;
}

const COVER_HEIGHT = 240;

/**
 * Cover image with an overlaid action row (back on the start side, favorite +
 * edit on the end side — flips with language), followed by the centered title,
 * description and meta chips.
 *
 * In `editing` mode the exact same layout renders its fields as inputs: the
 * cover becomes tap-to-replace, the title and description become inline text
 * fields seeded with the recipe's text, and the pencil turns into a cancel X.
 */
export function RecipeHeader({
  recipe,
  isFavorited,
  onToggleFavorite,
  onBack,
  canEdit,
  editing,
  onStartEdit,
  onCancelEdit,
  editTitle,
  editDescription,
  editCoverImageUrl,
  onChangeTitle,
  onChangeDescription,
  onPickImage,
  imageUploading,
}: RecipeHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = useIsRtl();
  const ink = theme.text?.val as string;
  const muted = theme.textMuted?.val as string;

  const coverUrl = editing ? editCoverImageUrl : recipe.coverImageUrl;

  const cover = (
    <View height={COVER_HEIGHT} borderRadius={20} overflow="hidden" backgroundColor="$bgSubtle">
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={{ width: '100%', height: '100%' }} />
      ) : null}

      {/* Replace-photo affordance, only in edit mode. */}
      {editing ? (
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
          {imageUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <ImagePlus size={26} color="#FFFFFF" />
              <Text color="#FFFFFF" fontSize={13} fontWeight="700">
                {t('newRecipe.manual.step1.photoChange')}
              </Text>
            </>
          )}
        </YStack>
      ) : null}

      <XStack
        position="absolute"
        top={16}
        left={16}
        right={16}
        alignItems="center"
        justifyContent="space-between"
        style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
      >
        <CircleIconButton onPress={onBack}>
          <ArrowRight size={22} color="#FFFFFF" strokeWidth={2} />
        </CircleIconButton>

        {/* Favorite + edit sit together on the end side; forced LTR so the
            pencil is always immediately to the right of the star. */}
        <XStack alignItems="center" gap="$2" style={{ direction: 'ltr' } as never}>
          {editing ? (
            <WhiteCircleButton onPress={onCancelEdit}>
              <X size={20} color={ink} strokeWidth={2.4} />
            </WhiteCircleButton>
          ) : (
            <>
              <FavoriteButton isFavorited={isFavorited} onPress={onToggleFavorite} />
              {canEdit ? (
                <WhiteCircleButton onPress={onStartEdit}>
                  <Pencil size={18} color={ink} strokeWidth={2} />
                </WhiteCircleButton>
              ) : null}
            </>
          )}
        </XStack>
      </XStack>
    </View>
  );

  return (
    <YStack gap="$3">
      {editing ? (
        <Pressable onPress={onPickImage} disabled={imageUploading}>
          {cover}
        </Pressable>
      ) : (
        cover
      )}

      <YStack gap="$2" alignItems="center" paddingHorizontal="$2">
        {editing ? (
          <>
            <TextInput
              value={editTitle}
              onChangeText={onChangeTitle}
              placeholder={recipe.title}
              placeholderTextColor={muted}
              style={{
                fontFamily: INPUT_FONT,
                fontSize: 24,
                fontWeight: '700',
                color: ink,
                textAlign: 'center',
                alignSelf: 'stretch',
                borderBottomWidth: 1,
                borderColor: theme.border?.val as string,
                borderStyle: 'dashed',
                paddingVertical: 6,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
              }}
            />
            <TextInput
              value={editDescription}
              onChangeText={onChangeDescription}
              placeholder={recipe.description}
              placeholderTextColor={muted}
              multiline
              style={{
                fontFamily: INPUT_FONT,
                fontSize: 15,
                color: muted,
                textAlign: 'center',
                alignSelf: 'stretch',
                paddingVertical: 4,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
              }}
            />
          </>
        ) : (
          <>
            <Text
              fontSize={26}
              fontWeight="700"
              letterSpacing={-0.5}
              color="$text"
              textAlign="center"
            >
              {recipe.title}
            </Text>
            {recipe.description ? (
              <Text fontSize={15} color="$textMuted" lineHeight={22} textAlign="center">
                {recipe.description}
              </Text>
            ) : null}
          </>
        )}
      </YStack>

      {editing ? null : <RecipeMetaTags recipe={recipe} />}
    </YStack>
  );
}

/**
 * Translucent ink disc over the cover photo — you can still read the image
 * through it. The alpha lives in the background color (`$overlay`, ink at 50%)
 * rather than on `opacity`, so the white glyph keeps full contrast.
 */
function CircleIconButton({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8}>
      <YStack
        width={40}
        height={40}
        borderRadius={999}
        backgroundColor="$overlay"
        alignItems="center"
        justifyContent="center"
        pressStyle={{ opacity: 0.75, scale: 0.94 }}
      >
        {children}
      </YStack>
    </Pressable>
  );
}

/**
 * Solid white disc matching the favorite button — used for the edit pencil and
 * the cancel X so they read as one control group beside the star.
 */
function WhiteCircleButton({
  onPress,
  children,
}: {
  onPress?: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8}>
      <YStack
        width={38}
        height={38}
        borderRadius={999}
        backgroundColor="#FFFFFF"
        alignItems="center"
        justifyContent="center"
        pressStyle={{ opacity: 0.8, scale: 0.94 }}
      >
        {children}
      </YStack>
    </Pressable>
  );
}
