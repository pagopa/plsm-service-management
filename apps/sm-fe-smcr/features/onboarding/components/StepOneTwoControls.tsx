import { Button } from "@repo/ui";
import { UseFormReturn } from "react-hook-form";
import { ProductStatus } from "../types/productStatus";
import { StepOneSchema } from "../types/stepOneSchema";
import { StepTwoSchema } from "../types/stepTwoSchema";
import { useFormContext } from "../context/FormContext";
import { defaultValues } from "../types/stepOneSchema";

type Props = {
  form: UseFormReturn<StepOneSchema> | UseFormReturn<StepTwoSchema>;
  handleDataTable?: (data: ProductStatus[] | undefined) => void;
  handleDeleteOn?: (data: boolean) => void;
  resetProductOptions?: () => void;
};
export default function StepOneTwoControls({
  form,
  handleDataTable,
  handleDeleteOn,
  resetProductOptions,
}: Props) {
  const { isFirstStep, isStepThree } = useFormContext();
  return (
    <div className="flex justify-between pt-8">
      <div className="flex gap-4">
        <Button
          variant={isStepThree ? "default" : "outline"}
          className="hover: cursor-pointer w-fit sm:w-32"
          type="button"
          onClick={() => {
            form.reset(defaultValues);
            if (isFirstStep) {
              if (resetProductOptions) {
                resetProductOptions();
              }
              if (handleDeleteOn) {
                handleDeleteOn(false);
              }
              if (handleDataTable) {
                handleDataTable(undefined);
              }
            }
          }}
        >
          Reset
        </Button>
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          name="prev"
          variant="outline"
          className="w-fit sm:w-32 hover: cursor-pointer disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
          disabled={isFirstStep}
        >
          Indietro
        </Button>
        <Button
          name="next"
          variant={form.formState.isValid ? "pagopaprimary" : "outline"}
          type="submit"
          className="w-fit sm:w-32"
        >
          Avanti
        </Button>
      </div>
    </div>
  );
}
