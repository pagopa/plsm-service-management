import { useCallback, useState } from "react";
import { flushSync } from "react-dom";

const steps = [1, 2, 3, 4] as const;
const lastStep = steps[steps.length - 1];
export type Steps = typeof steps;

export type Step = (typeof steps)[number];

export function useStep() {
  const [currentStep, setCurrentStep] = useState<Step>(1);

  const isStepThree = currentStep === 3;
  const isFirstStep = currentStep === 1;
  const isStepFour = currentStep === 4;
  const isStepTwo = currentStep === 2;

  const nextStep = useCallback(() => {
    document.startViewTransition(() => {
      flushSync(() => {
        setCurrentStep((prev) => {
          if (prev === lastStep) return lastStep;
          return (prev + 1) as Step;
        });
      });
    });
  }, []);

  const prevStep = useCallback(() => {
    document.startViewTransition(() => {
      flushSync(() => {
        setCurrentStep((prev) => {
          if (prev === 1) return 1;
          return (prev - 1) as Step;
        });
      });
    });
  }, []);

  const goToStepOne = useCallback(() => {
    document.startViewTransition(() => {
      flushSync(() => {
        setCurrentStep(1);
      });
    });
  }, []);

  const goToStepFour = useCallback(() => {
    document.startViewTransition(() => {
      flushSync(() => {
        setCurrentStep(4);
      });
    });
  }, []);

  const handleStepChange = useCallback((value: number) => {
    if (value === 1 || value === 2 || value === 3) {
      setCurrentStep(value);
    }
  }, []);

  return {
    currentStep,
    nextStep,
    prevStep,
    goToStepOne,
    goToStepFour,
    isFirstStep,
    isStepTwo,
    isStepThree,
    isStepFour,
    handleStepChange,
    steps,
  };
}
