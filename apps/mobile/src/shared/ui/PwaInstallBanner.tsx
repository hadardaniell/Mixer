import { Download, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { Button, Text, useTheme, XStack, YStack } from 'tamagui';

import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallBanner() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (Platform.OS !== 'web' || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <XStack
        backgroundColor="$surface"
        borderColor="$border"
        borderWidth={1}
        borderRadius={16}
        padding="$3"
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$3"
        shadowColor="black"
        shadowOpacity={0.1}
        shadowRadius={8}
        elevation={4}
      >
        <XStack alignItems="center" gap="$3" flex={1}>
          <YStack
            width={40}
            height={40}
            borderRadius={12}
            backgroundColor="$buttonSecondaryBg"
            alignItems="center"
            justifyContent="center"
          >
            <Download size={20} color={theme.textOnSecondary?.val as string} />
          </YStack>
          <YStack flex={1}>
            <Text fontSize={14} fontWeight="700" color="$text">
              {t('pwa.installTitle', 'התקנת Mixer למסך הבית')}
            </Text>
            <Text fontSize={12} color="$textMuted">
              {t('pwa.installSubtitle', 'שיתוף מתכונים מ-TikTok ו-Instagram בלחיצה אחת')}
            </Text>
          </YStack>
        </XStack>

        <XStack alignItems="center" gap="$2">
          <Button
            size="$3"
            backgroundColor="$buttonPrimaryBg"
            pressStyle={{ opacity: 0.8 }}
            onPress={handleInstall}
            borderRadius={12}
          >
            <Text color="$buttonPrimaryText" fontSize={13} fontWeight="700">
              {t('pwa.installBtn', 'התקנה')}
            </Text>
          </Button>
          <YStack
            onPress={() => setDismissed(true)}
            padding="$1"
            pressStyle={{ opacity: 0.5 }}
            accessibilityRole="button"
          >
            <X size={18} color={theme.textMuted?.val as string} />
          </YStack>
        </XStack>
      </XStack>

      <ConfirmDialog
        open={showGuide}
        title={t('pwa.guideTitle', 'איך להתקין את Mixer למסך הבית?')}
        message={t(
          'pwa.guideMessage',
          '1. לחצו על 3 הנקודות ⋮ בתפריט הדפדפן למעלה\n2. בחרו "הוספה למסך הבית" (Add to Home Screen)'
        )}
        confirmLabel={t('common.understood', 'הבנתי')}
        cancelLabel={t('common.close', 'סגור')}
        onConfirm={() => setShowGuide(false)}
        onCancel={() => setShowGuide(false)}
      />
    </>
  );
}
