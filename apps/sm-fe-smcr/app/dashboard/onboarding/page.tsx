import OnBoardingForm from "@/features/onboarding/components/OnboardingForm";
import { FormProvider } from "@/features/onboarding/context/FormContext";
export default function OnBoardingPage() {
  return (
    <FormProvider>
      <OnBoardingForm />
    </FormProvider>
  );
}
