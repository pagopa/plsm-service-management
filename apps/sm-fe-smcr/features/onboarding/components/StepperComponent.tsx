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
    <div className="ui:mx-auto ui:max-w-xl my-8  ui:text-center">
      <Stepper value={currentStep} onValueChange={handleStepChange}>
        {steps.map((step) => (
          <StepperItem key={step} step={step} className="not-last:ui:flex-1">
            <StepperTrigger asChild>
              <StepperIndicator />
            </StepperTrigger>
            {step < steps.length && <StepperSeparator />}
          </StepperItem>
        ))}
      </Stepper>

      <div className="ui:flex ui:justify-center ui:space-x-4"></div>
    </div>
  );
}
