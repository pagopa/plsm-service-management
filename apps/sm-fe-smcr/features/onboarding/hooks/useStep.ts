import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { verifyRecipientCode } from "../actions/verifyRecipientCode";

const steps = [1, 2, 3, 4] as const;
const lastStep = steps[steps.length - 1];
export type Steps = typeof steps;

export type Step = (typeof steps)[number];

export type StepOneVerificationData = {
  productId: string;
  origin: string;
  originId: string;
  recipientCode: string;
};

export type NextStepResult =
  | { advanced: true }
  | {
      advanced: false;
      fieldErrors: { recipientCode?: string; originId?: string };
    };

export function useStep() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isVerifying, setIsVerifying] = useState(false);

  const isStepThree = currentStep === 3;
  const isFirstStep = currentStep === 1;
  const isStepFour = currentStep === 4;
  const isStepTwo = currentStep === 2;

  const advanceStep = useCallback(() => {
    document.startViewTransition(() => {
      flushSync(() => {
        setCurrentStep((prev) => {
          if (prev === lastStep) return lastStep;
          return (prev + 1) as Step;
        });
      });
    });
  }, []);

  const nextStep = useCallback(
    async (
      verificationData?: StepOneVerificationData,
    ): Promise<NextStepResult> => {
      if (currentStep === 1 && verificationData) {
        if (
          verificationData.productId === "prod-pn" &&
          verificationData.origin === "IPA"
        ) {
          setIsVerifying(true);
          try {
            const result = await verifyRecipientCode({
              originId: verificationData.originId,
              recipientCode: verificationData.recipientCode,
            });
            if (!result.success) {
              const fieldErrors: { recipientCode?: string; originId?: string } =
                result.code === "DENIED_NO_ASSOCIATION"
                  ? { recipientCode: result.message, originId: result.message }
                  : { recipientCode: result.message };
              return { advanced: false, fieldErrors };
            }
          } finally {
            setIsVerifying(false);
          }
        }
      }
      advanceStep();
      return { advanced: true };
    },
    [currentStep, advanceStep],
  );

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
    isVerifying,
  };
}
