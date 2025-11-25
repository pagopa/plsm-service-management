"use client";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { CheckIcon, LoaderCircleIcon } from "lucide-react";
import * as React from "react";
import { createContext, useContext } from "react";

// Types
type StepperContextValue = {
  activeStep: number;
  setActiveStep: (step: number) => void;
  orientation: "horizontal" | "vertical";
};

type StepItemContextValue = {
  step: number;
  state: StepState;
  isDisabled: boolean;
  isLoading: boolean;
};

type StepState = "active" | "completed" | "inactive" | "loading";

// Contexts
const StepperContext = createContext<StepperContextValue | undefined>(undefined);
const StepItemContext = createContext<StepItemContextValue | undefined>(undefined);

const useStepper = () => {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within a Stepper");
  }
  return context;
};

const useStepItem = () => {
  const context = useContext(StepItemContext);
  if (!context) {
    throw new Error("useStepItem must be used within a StepperItem");
  }
  return context;
};

// Components
interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  orientation?: "horizontal" | "vertical";
}

function Stepper({
  defaultValue = 0,
  value,
  onValueChange,
  orientation = "horizontal",
  className,
  ...props
}: StepperProps) {
  const [activeStep, setInternalStep] = React.useState(defaultValue);

  const setActiveStep = React.useCallback(
    (step: number) => {
      if (value === undefined) {
        setInternalStep(step);
      }
      onValueChange?.(step);
    },
    [value, onValueChange],
  );

  const currentStep = value ?? activeStep;

  return (
    <StepperContext.Provider
      value={{
        activeStep: currentStep,
        setActiveStep,
        orientation,
      }}
    >
      <div
        data-slot="stepper"
        className={cn(
          "ui:group/stepper ui:inline-flex data-[orientation=horizontal]:ui:w-full data-[orientation=horizontal]:ui:flex-row data-[orientation=vertical]:ui:flex-col",
          className,
        )}
        data-orientation={orientation}
        {...props}
      />
    </StepperContext.Provider>
  );
}

// StepperItem
interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number;
  completed?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

function StepperItem({
  step,
  completed = false,
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}: StepperItemProps) {
  const { activeStep } = useStepper();

  const state: StepState =
    completed || step < activeStep ? "completed" : activeStep === step ? "active" : "inactive";

  const isLoading = loading && step === activeStep;

  return (
    <StepItemContext.Provider value={{ step, state, isDisabled: disabled, isLoading }}>
      <div
        data-slot="stepper-item"
        className={cn(
          "ui:group/step ui:flex ui:items-center ui:group-data-[orientation=horizontal]/stepper:flex-row ui:group-data-[orientation=vertical]/stepper:flex-col",
          className,
        )}
        data-state={state}
        {...(isLoading ? { "data-loading": true } : {})}
        {...props}
      >
        {children}
      </div>
    </StepItemContext.Provider>
  );
}

// StepperTrigger
interface StepperTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

function StepperTrigger({ asChild = false, className, children, ...props }: StepperTriggerProps) {
  const { setActiveStep } = useStepper();
  const { step, isDisabled } = useStepItem();

  if (asChild) {
    const Comp = asChild ? Slot : "span";
    return (
      <Comp data-slot="stepper-trigger" className={className}>
        {children}
      </Comp>
    );
  }

  return (
    <button
      data-slot="stepper-trigger"
      className={cn(
        "ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:inline-flex ui:items-center ui:gap-3 ui:rounded-full ui:outline-none ui:focus-visible:z-10 ui:focus-visible:ring-[3px] ui:disabled:pointer-events-none ui:disabled:opacity-50",
        className,
      )}
      onClick={() => setActiveStep(step)}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
}

// StepperIndicator
interface StepperIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

function StepperIndicator({
  asChild = false,
  className,
  children,
  ...props
}: StepperIndicatorProps) {
  const { state, step, isLoading } = useStepItem();

  return (
    <span
      data-slot="stepper-indicator"
      className={cn(
        "ui:bg-muted ui:text-muted-foreground data-[state=active]:ui:bg-primary data-[state=completed]:ui:bg-primary data-[state=active]:ui:text-primary-foreground data-[state=completed]:ui:text-primary-foreground ui:relative ui:flex ui:size-6 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-full ui:text-xs ui:font-medium",
        className,
      )}
      data-state={state}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          <span className="ui:transition-all ui:group-data-loading/step:scale-0 ui:group-data-loading/step:opacity-0 ui:group-data-loading/step:transition-none ui:group-data-[state=completed]/step:scale-0 ui:group-data-[state=completed]/step:opacity-0">
            {step}
          </span>
          <CheckIcon
            className="ui:absolute ui:scale-0 ui:opacity-0 ui:transition-all ui:group-data-[state=completed]/step:scale-100 ui:group-data-[state=completed]/step:opacity-100"
            size={16}
            aria-hidden="true"
          />
          {isLoading && (
            <span className="ui:absolute ui:transition-all">
              <LoaderCircleIcon className="ui:animate-spin" size={14} aria-hidden="true" />
            </span>
          )}
        </>
      )}
    </span>
  );
}

// StepperTitle
function StepperTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 data-slot="stepper-title" className={cn("ui:text-sm ui:font-medium", className)} {...props} />
  );
}

// StepperDescription
function StepperDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="stepper-description"
      className={cn("ui:text-muted-foreground ui:text-sm", className)}
      {...props}
    />
  );
}

// StepperSeparator
function StepperSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="stepper-separator"
      className={cn(
        "ui:bg-muted ui:group-data-[state=completed]/step:bg-primary ui:m-0.5 ui:group-data-[orientation=horizontal]/stepper:h-0.5 ui:group-data-[orientation=horizontal]/stepper:w-full ui:group-data-[orientation=horizontal]/stepper:flex-1 ui:group-data-[orientation=vertical]/stepper:h-12 ui:group-data-[orientation=vertical]/stepper:w-0.5",
        className,
      )}
      {...props}
    />
  );
}

export {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
};
