import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger,
} from "@/components/ui/stepper";
import { useFormContext } from "../context/FormContext";

export default function StepperComponent() {
  const { currentStep, handleStepChange, steps } = useFormContext();
  return (
    <div className="mx-auto max-w-xl my-8 text-center">
      <Stepper value={currentStep} onValueChange={handleStepChange}>
        {steps.map((step) => (
          <StepperItem key={step} step={step} className="not-last:flex-1">
            <StepperTrigger asChild>
              <StepperIndicator />
            </StepperTrigger>
            {step < steps.length && <StepperSeparator />}
          </StepperItem>
        ))}
      </Stepper>

      <div className="flex justify-center space-x-4"></div>
    </div>
  );
}
