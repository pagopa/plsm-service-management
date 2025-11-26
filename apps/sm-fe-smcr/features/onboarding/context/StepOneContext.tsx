"use client";

import { createContext, useContext } from "react";
import { UseFormReturn } from "react-hook-form";
import { ApiOptionsApicale } from "../types/apiOptionsType";
import { ProductStatus } from "../types/productStatus";
import { StepOneSchema } from "../types/stepOneSchema";
import { SubunitOption } from "../types/subunitOptionsType";

type UpdateFormContextType = {
  formRef: React.RefObject<HTMLFormElement | null>;
  form: UseFormReturn<StepOneSchema>;
  handleSubunitOption: (value: SubunitOption) => void;
  handleApiOption: (value: ApiOptionsApicale) => void;
  isDeleteOn: boolean;
  handleDeleteOn: (value: boolean) => void;
  dataTable: ProductStatus[] | undefined;
};

export const StepOneContext = createContext<UpdateFormContextType | null>(null);

export function useStepOneContext() {
  const context = useContext(StepOneContext);
  if (!context) {
    throw new Error("useUpdateFormContext must be used within a FormProvider");
  }
  return context;
}
