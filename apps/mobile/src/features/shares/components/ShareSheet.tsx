import type { ShareResourceType } from '@mixer/contracts';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, MessageCircle, MoreHorizontal } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, Share } from 'react-native';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';

import { MemberAvatar } from '@/features/book/components/MemberAvatar';
import { useFriends } from '@/features/friends/hooks/useFriends';
import { useRecipe } from '@/features/recipe/hooks/useRecipe';
import { recipeToText } from '@/features/recipe/lib/recipeToText';
import { Loader } from '@/shared/ui/Loader';
import { Sheet } from '@/shared/ui/Sheet';

import { useAlreadySharedWith, useSendShare } from '../hooks/useSendShare';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: ShareResourceType;
  resourceId: string;
}

/**
 * TikTok-style share sheet with:
 *  1. "Send to" horizontal scroll row of friends in Mixer
 *  2. "Share to" action row: WhatsApp, Copy Link, Native Device Share
 *  3. Cancel button at bottom
 */
export function ShareSheet({ open, onOpenChange, resourceType, resourceId }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { friends, isLoading } = useFriends();
  const { friendIds: alreadyShared } = useAlreadySharedWith({ resourceType, resourceId }, open);
  const send = useSendShare();

  const { data: recipe } = useRecipe(resourceType === 'recipe' ? resourceId : '');

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [failedCount, setFailedCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setFailedCount(0);
      setCopied(false);
      send.reset();
    }
  }, [open]);

  const toggle = (id: string) => {
    if (alreadyShared.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirm = () => {
    if (selected.size === 0 || send.isPending) return;
    send.mutate(
      { resourceType, resourceId, friendIds: [...selected] },
      {
        onSuccess: ({ failed }) => {
          setFailedCount(failed.length);
          if (failed.length === 0) onOpenChange(false);
          else setSelected(new Set(failed));
        },
      },
    );
  };

  const getShareText = () => {
    if (recipe) {
      let text = recipeToText(recipe, t);
      if (recipe.source?.type === 'url' && recipe.source.url) {
        text += `\n\n${recipe.source.url}`;
      }
      return text;
    }
    return t('share.sheet.title');
  };

  const handleWhatsAppShare = async () => {
    const text = getShareText();
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    const webUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Share.share({ message: text });
    }
  };

  const handleCopyLink = async () => {
    const text = getShareText();
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    const text = getShareText();
    try {
      await Share.share({
        message: text,
        title: recipe?.title,
      });
    } catch {
      // User cancelled
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[75]}>
      <YStack gap="$4" paddingBottom="$2">
        {/* Title */}
        <YStack gap="$1" alignItems="center">
          <Text color="$text" fontSize={18} fontWeight="700" textAlign="center">
            {t('share.sheet.title')}
          </Text>
          <Text color="$textMuted" fontSize={13} textAlign="center">
            {t('share.sheet.subtitle')}
          </Text>
        </YStack>

        {/* Section 1: Send to (In-App Friends Horizontal Scroll) */}
        <YStack gap="$2">
          <Text fontSize={14} fontWeight="700" color="$text" paddingHorizontal="$2">
            {t('share.sheet.sendTo')}
          </Text>

          {isLoading ? (
            <YStack paddingVertical="$4" alignItems="center">
              <Loader />
            </YStack>
          ) : friends.length === 0 ? (
            <Text color="$textMuted" fontSize={13} textAlign="center" paddingVertical="$3">
              {t('share.sheet.noFriends')}
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 4, gap: 14 }}
            >
              {friends.map((f) => {
                const isShared = alreadyShared.has(f.id);
                const isSelected = selected.has(f.id);

                return (
                  <Pressable
                    key={f.id}
                    onPress={() => toggle(f.id)}
                    disabled={isShared}
                    style={{ alignItems: 'center', width: 68 }}
                  >
                    <YStack position="relative" marginBottom={6}>
                      <View
                        borderRadius={999}
                        borderWidth={isSelected ? 2.5 : 1}
                        borderColor={isSelected ? '$buttonSecondaryBg' : '$border'}
                        padding={2}
                        opacity={isShared ? 0.5 : 1}
                      >
                        <MemberAvatar
                          displayName={f.displayName ?? ''}
                          avatarUrl={f.avatarUrl ?? undefined}
                          size={54}
                        />
                      </View>
                      {isSelected ? (
                        <View
                          position="absolute"
                          bottom={0}
                          right={0}
                          width={20}
                          height={20}
                          borderRadius={999}
                          backgroundColor="$buttonSecondaryBg"
                          alignItems="center"
                          justifyContent="center"
                          borderWidth={1.5}
                          borderColor="#FFFFFF"
                        >
                          <Check
                            size={12}
                            color={theme.textOnSecondary?.val as string}
                            strokeWidth={3}
                          />
                        </View>
                      ) : isShared ? (
                        <View
                          position="absolute"
                          bottom={0}
                          right={-2}
                          backgroundColor="$overlay"
                          borderRadius={8}
                          paddingHorizontal={4}
                          paddingVertical={1}
                        >
                          <Text color="#FFFFFF" fontSize={9} fontWeight="700">
                            {t('share.sheet.alreadyShared')}
                          </Text>
                        </View>
                      ) : null}
                    </YStack>
                    <Text
                      color={isShared ? '$textMuted' : '$text'}
                      fontSize={12}
                      fontWeight="600"
                      numberOfLines={1}
                      textAlign="center"
                      style={{ width: 68 }}
                    >
                      {f.displayName ?? ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </YStack>

        {/* Send to selected in-app friends button */}
        {selected.size > 0 ? (
          <YStack
            onPress={confirm}
            disabled={send.isPending}
            height={46}
            borderRadius={16}
            backgroundColor="$buttonPrimaryBg"
            alignItems="center"
            justifyContent="center"
            pressStyle={{ backgroundColor: '$buttonPrimaryBgHover' }}
          >
            <Text color="$buttonPrimaryText" fontSize={15} fontWeight="700">
              {send.isPending
                ? t('share.sheet.sending')
                : t('share.sheet.confirm', { count: selected.size })}
            </Text>
          </YStack>
        ) : null}

        {send.isError ? (
          <Text color="$danger" fontSize={13} textAlign="center">
            {t('share.sheet.error')}
          </Text>
        ) : failedCount > 0 ? (
          <Text color="$danger" fontSize={13} textAlign="center">
            {t('share.sheet.partialError', { count: failedCount })}
          </Text>
        ) : null}

        {/* Section 2: Share to (External Apps) */}
        <YStack gap="$2" marginTop="$2">
          <Text fontSize={14} fontWeight="700" color="$text" paddingHorizontal="$2">
            {t('share.sheet.shareTo')}
          </Text>

          <XStack justifyContent="space-around" alignItems="center" paddingVertical="$2">
            {/* WhatsApp */}
            <Pressable onPress={handleWhatsAppShare} style={{ alignItems: 'center', gap: 6 }}>
              <YStack
                width={52}
                height={52}
                borderRadius={999}
                backgroundColor="#25D366"
                alignItems="center"
                justifyContent="center"
                elevation={3}
                pressStyle={{ opacity: 0.8, scale: 0.95 }}
              >
                <MessageCircle size={24} color="#FFFFFF" strokeWidth={2.2} />
              </YStack>
              <Text fontSize={12} fontWeight="600" color="$text">
                {t('share.sheet.whatsapp')}
              </Text>
            </Pressable>

            {/* Copy Link */}
            <Pressable onPress={handleCopyLink} style={{ alignItems: 'center', gap: 6 }}>
              <YStack
                width={52}
                height={52}
                borderRadius={999}
                backgroundColor={copied ? '$buttonSecondaryBg' : '#007AFF'}
                alignItems="center"
                justifyContent="center"
                elevation={3}
                pressStyle={{ opacity: 0.8, scale: 0.95 }}
              >
                {copied ? (
                  <Check
                    size={24}
                    color={theme.textOnSecondary?.val as string}
                    strokeWidth={2.5}
                  />
                ) : (
                  <Copy size={22} color="#FFFFFF" strokeWidth={2.2} />
                )}
              </YStack>
              <Text fontSize={12} fontWeight="600" color={copied ? '$buttonSecondaryBg' : '$text'}>
                {copied ? t('share.sheet.copied') : t('share.sheet.copyLink')}
              </Text>
            </Pressable>

            {/* Native Share / More */}
            <Pressable onPress={handleNativeShare} style={{ alignItems: 'center', gap: 6 }}>
              <YStack
                width={52}
                height={52}
                borderRadius={999}
                backgroundColor="$bgSubtle"
                borderWidth={1}
                borderColor="$border"
                alignItems="center"
                justifyContent="center"
                elevation={1}
                pressStyle={{ opacity: 0.8, scale: 0.95 }}
              >
                <MoreHorizontal size={24} color={theme.text?.val as string} strokeWidth={2.2} />
              </YStack>
              <Text fontSize={12} fontWeight="600" color="$text">
                {t('share.sheet.more')}
              </Text>
            </Pressable>
          </XStack>
        </YStack>

        {/* Section 3: Cancel Button */}
        <YStack
          onPress={() => onOpenChange(false)}
          height={48}
          borderRadius={18}
          backgroundColor="$bgSubtle"
          alignItems="center"
          justifyContent="center"
          marginTop="$3"
          pressStyle={{ opacity: 0.7 }}
        >
          <Text color="$text" fontSize={15} fontWeight="700">
            {t('share.sheet.cancel')}
          </Text>
        </YStack>
      </YStack>
    </Sheet>
  );
}

