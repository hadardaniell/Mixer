import { useRouter } from 'expo-router';
import { useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, YStack } from 'tamagui';

import { useIsRtl } from '@/shared/lib/useIsRtl';

import { BookStepper } from '../components/BookStepper';
import { Step1Basics } from '../components/Step1Basics';
import { Step2Recipes } from '../components/Step2Recipes';
import { Step3Share } from '../components/Step3Share';
import { Step4Cover } from '../components/Step4Cover';
import { WizardFooter } from '@/features/recipe/components/manual/WizardFooter';
import { useCreateBook } from '../hooks/useCreateBook';
import { bookFormReducer, canAdvance, initialBookForm, toCreateInput } from '../lib/bookForm';

const TOTAL_STEPS = 4;

export function CreateBookScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRtl = useIsRtl();

  const [form, dispatch] = useReducer(bookFormReducer, initialBookForm);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateBook();

  const goBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/home' as never);
  };

  const goNext = async () => {
    if (create.isPending || !canAdvance(step, form)) return;
    setError(null);
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    try {
      await create.mutateAsync(toCreateInput(form));
      // No book-detail route yet; land on home where the new book appears.
      router.replace('/home' as never);
    } catch {
      setError(t('createBook.saveError'));
    }
  };

  const isLast = step === TOTAL_STEPS;
  const nextLabel = create.isPending
    ? t('createBook.saving')
    : isLast
      ? t('createBook.create')
      : t('createBook.next');

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Basics form={form} dispatch={dispatch} />;
      case 2:
        return <Step2Recipes form={form} dispatch={dispatch} />;
      case 3:
        return <Step3Share form={form} dispatch={dispatch} />;
      default:
        return <Step4Cover form={form} dispatch={dispatch} />;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <YStack
        flex={1}
        width="100%"
        paddingTop={insets.top + 36}
        style={{ direction: isRtl ? 'rtl' : 'ltr' } as never}
      >
        {/* Stepper — pinned at the top */}
        <YStack paddingHorizontal="$4">
          <BookStepper current={step} total={TOTAL_STEPS} />
        </YStack>

        {/* Only the step body scrolls (e.g. the recipe grid in step 2) */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
          {error ? (
            <Text color="$danger" fontSize={13} textAlign="center" marginTop="$2">
              {error}
            </Text>
          ) : null}
        </ScrollView>

        {/* Footer — pinned, lifted above the floating nav bar (~72px tall) */}
        <YStack paddingHorizontal="$4" paddingTop="$2" paddingBottom={insets.bottom + 92}>
          <WizardFooter
            backLabel={t('createBook.back')}
            nextLabel={nextLabel}
            onBack={goBack}
            onNext={goNext}
            backDisabled={step === 1 || create.isPending}
            nextDisabled={create.isPending || !canAdvance(step, form)}
          />
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
