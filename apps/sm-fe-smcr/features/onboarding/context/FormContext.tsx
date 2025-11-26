"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { StepFourData } from "../types/stepFourData";
import { OnboardingSchema } from "../types/onboardingSchema";
import {
  StepOneSchema,
  defaultValues as defaultValuesStepOne,
} from "../types/stepOneSchema";
import {
  StepTwoSchema,
  defaultValues as defaultValuesStepTwo,
} from "../types/stepTwoSchema";
import { Step, Steps, useStep } from "../hooks/useStep";

type FormContextType = {
  currentStep: Step;
  isFirstStep: boolean;
  isStepTwo: boolean;
  isStepThree: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStepOne: () => void;
  handleStepChange: (step: number) => void;
  steps: Steps;
  formData: OnboardingSchema;
  updateFormData: (data: Partial<OnboardingSchema>) => void;
  goToStepFour: () => void;
  handleStepFourData: (data: Partial<StepFourData>) => void;
  stepFourData: StepFourData;
  isStepOneSubmitted: boolean;
  handleStepOneSubmit: () => void;
  isStepTwoSubmitted: boolean;
  handleStepTwoSubmit: () => void;
  resetStepOneIsSubmitted: () => void;
  resetStepTwoIsSubmitted: () => void;
};

type Props = {
  children: React.ReactNode;
};

const FormContext = createContext<FormContextType | null>(null);

export const FormProvider = ({ children }: Props) => {
  const {
    currentStep,
    isFirstStep,
    isStepTwo,
    isStepThree,
    nextStep,
    prevStep,
    goToStepOne,
    handleStepChange,
    steps,
    goToStepFour,
  } = useStep();

  const [formData, setFormData] = useState<OnboardingSchema>({
    ...defaultValuesStepOne,
    ...defaultValuesStepTwo,
  });

  const [stepFourData, setStepFourData] = useState<StepFourData>({
    taxcode: "",
    product: "",
    subunit: "",
    subunitCode: "",
    businessName: "",
    productId: "",
    dataTable: undefined,
  });

  const [isStepOneSubmitted, setIsStepOneSubmitted] = useState(false);
  const [isStepTwoSubmitted, setIsStepTwoSubmitted] = useState(false);

  const handleStepFourData = useCallback((data: Partial<StepFourData>) => {
    setStepFourData((prev) => {
      return { ...prev, ...data };
    });
  }, []);

  const updateFormData = useCallback(
    (data: Partial<StepOneSchema> | Partial<StepTwoSchema>): void => {
      setFormData((prev) => {
        return { ...prev, ...data };
      });
    },
    [],
  );

  const handleStepOneSubmit = useCallback((): void => {
    setIsStepOneSubmitted(true);
  }, []);

  const resetStepOneIsSubmitted = useCallback(() => {
    setIsStepOneSubmitted(false);
  }, []);

  const resetStepTwoIsSubmitted = useCallback(() => {
    setIsStepTwoSubmitted(false);
  }, []);

  const handleStepTwoSubmit = useCallback((): void => {
    setIsStepTwoSubmitted(true);
  }, []);

  return (
    <FormContext
      value={{
        currentStep,
        isFirstStep,
        isStepTwo,
        isStepThree,
        nextStep,
        prevStep,
        goToStepOne,
        handleStepChange,
        steps,
        formData,
        updateFormData,
        goToStepFour,
        handleStepFourData,
        stepFourData,
        isStepOneSubmitted,
        handleStepOneSubmit,
        isStepTwoSubmitted,
        handleStepTwoSubmit,
        resetStepOneIsSubmitted,
        resetStepTwoIsSubmitted,
      }}
    >
      {children}
    </FormContext>
  );
};

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
}
