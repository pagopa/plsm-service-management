"use client";

import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import useClipboard from "@/hooks/useClipboard";
import { useActionState, useEffect, useState } from "react";
import { onSubmitFormData } from "../actions/onSubmitFormData";
import { generatePayload } from "../utils/generatePayload";
import { toast } from "sonner";
import StepFour from "./StepFour";
import StepperComponent from "./StepperComponent";
import { useFormContext } from "../context/FormContext";
import { OutputOption } from "../utils/constants";
import { StepThreeControls } from "./StepThreeControls";

export default function OnBoardingForm() {
  const {
    formData,
    handleStepFourData,
    nextStep,
    currentStep,
    resetStepOneIsSubmitted,
    resetStepTwoIsSubmitted,
  } = useFormContext();

  const { isCopied, copyToClipboard } = useClipboard();

  const [outputOption, setOutputOption] = useState<OutputOption>("clipboard");

  function handleOutputOptionChange(value: OutputOption) {
    setOutputOption(value);
  }

  const [state, action, isPending] = useActionState(onSubmitFormData, null);
  async function handleSubmit() {
    if (outputOption === "clipboard") {
      copyToClipboard(JSON.stringify(generatePayload(formData)));
      toast.success("Json copiato nella clipboard!");
    } else {
      const newFormData = new FormData();
      newFormData.append("output", outputOption);
      newFormData.append("data", JSON.stringify(formData));
      return action(newFormData);
    }
  }
  useEffect(() => {
    if (!state || isPending) return;
    if (!state.success || !state.data) {
      toast.error(state.message);
      return;
    }
    handleStepFourData(state.data);
    toast.success(state.message);
    resetStepOneIsSubmitted();
    resetStepTwoIsSubmitted();
    nextStep();
  }, [
    state,
    isPending,
    nextStep,
    handleStepFourData,
    resetStepOneIsSubmitted,
    resetStepTwoIsSubmitted,
  ]);

  function renderStep() {
    switch (currentStep) {
      case 1:
        return <StepOne style={{ viewTransitionName: "stepOne" }} />;
      case 2:
        return <StepTwo style={{ viewTransitionName: "stepTwo" }} />;
      case 3:
        return (
          <>
            <StepOne />
            <StepTwo />
            <form action={handleSubmit}>
              <StepThreeControls
                isPending={isPending}
                outputOption={outputOption}
                handleOutputOptionChange={handleOutputOptionChange}
              />
            </form>
          </>
        );
      case 4:
        return <StepFour />;
      default:
        throw Error(`Invalid currentStep: ${currentStep satisfies never}`);
    }
  }

  return (
    <div className="container flex flex-col py-8  max-w-3xl mx-auto bg-[#f5f5f5] ">
      <div>
        <h1 className="text-4xl text-center font-bold mb-12">Onboarding</h1>
        <div className="mx-0.5 xl:mx-0">{renderStep()}</div>
      </div>
    </div>
  );
}
