import { useRouter } from 'expo-router';
import { useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, YStack } from 'tamagui';

import { useManualRecipeDraft } from '@/features/recipe/hooks/useManualRecipeDraft';
import {
  canAdvance,
  initialManualForm,
  manualFormReducer,
  stepPatch,
} from '@/features/recipe/lib/manualRecipe';
import { useIsRtl } from '@/shared/lib/useIsRtl';

import { ManualStepper } from '../components/manual/ManualStepper';
import { Step1Basics } from '../components/manual/Step1Basics';
import { Step2Details } from '../components/manual/Step2Details';
import { Step3Ingredients } from '../components/manual/Step3Ingredients';
import { Step4Steps } from '../components/manual/Step4Steps';
import { Step5Review } from '../components/manual/Step5Review';
import { WizardFooter } from '../components/manual/WizardFooter';

const TOTAL_STEPS = 5;

export function CreateManualScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRtl = useIsRtl();

  const [form, dispatch] = useReducer(manualFormReducer, initialManualForm);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const { isSaving, saveStep, publish } = useManualRecipeDraft();

  const goBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/new-recipe' as never);
  };

  const goNext = async () => {
    if (isSaving || !canAdvance(step, form)) return;
    setError(null);
    try {
      if (step === TOTAL_STEPS) {
        // Step 5 is review-only; the draft already holds every field, so just publish.
        const recipe = await publish();
        router.replace(`/recipes/${recipe.id}` as never);
        return;
      }
      await saveStep(stepPatch(step, form));
      setStep((s) => s + 1);
    } catch {
      setError(t('newRecipe.manual.saveError'));
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Basics form={form} dispatch={dispatch} />;
      case 2:
        return <Step2Details form={form} dispatch={dispatch} />;
      case 3:
        return <Step3Ingredients form={form} dispatch={dispatch} />;
      case 4:
        return <Step4Steps form={form} dispatch={dispatch} />;
      default:
        return <Step5Review form={form} />;
    }
  };

  const nextLabel = isSaving
    ? t('newRecipe.manual.saving')
    : step === TOTAL_STEPS
      ? t('newRecipe.manual.buttons.save')
      : t('newRecipe.manual.buttons.next');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 140 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack
          width="100%"
          maxWidth={440}
          alignSelf="center"
          paddingHorizontal="$4"
          gap="$4"
          style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
        >
          <ManualStepper current={step} total={TOTAL_STEPS} onBack={goBack} />

          {renderStep()}

          {error ? (
            <Text color="$danger" fontSize={13} textAlign="center">
              {error}
            </Text>
          ) : null}

          <WizardFooter
            backLabel={t('newRecipe.manual.buttons.back')}
            nextLabel={nextLabel}
            onBack={goBack}
            onNext={goNext}
            backDisabled={step === 1 || isSaving}
            nextDisabled={isSaving || !canAdvance(step, form)}
          />
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
