"use client";

import { Button } from "@/components/ui/button";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger,
} from "@/components/ui/stepper";
import { useState } from "react";

const steps = [1, 2, 3, 4];

export default function Component() {
  const [currentStep, setCurrentStep] = useState(2);

  return (
    <div className="ui:mx-auto ui:max-w-xl ui:space-y-8 ui:text-center">
      <Stepper value={currentStep} onValueChange={setCurrentStep}>
        {steps.map((step) => (
          <StepperItem key={step} step={step} className="not-last:ui:flex-1">
            <StepperTrigger asChild>
              <StepperIndicator />
            </StepperTrigger>
            {step < steps.length && <StepperSeparator />}
          </StepperItem>
        ))}
      </Stepper>
      <div className="ui:flex ui:justify-center ui:space-x-4">
        <Button
          variant="outline"
          className="ui:w-32"
          onClick={() => setCurrentStep((prev) => prev - 1)}
          disabled={currentStep === 1}
        >
          Prev step
        </Button>
        <Button
          variant="outline"
          className="ui:w-32"
          onClick={() => setCurrentStep((prev) => prev + 1)}
          disabled={currentStep > steps.length}
        >
          Next step
        </Button>
      </div>
      <p className="ui:text-muted-foreground ui:mt-2 ui:text-xs" role="region" aria-live="polite">
        Controlled stepper with checkmarks
      </p>
    </div>
  );
}
