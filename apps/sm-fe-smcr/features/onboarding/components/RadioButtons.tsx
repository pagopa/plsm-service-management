import * as RadioGroup from "@radix-ui/react-radio-group";
import { CircleCheck } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { StepOneSchema } from "../types/stepOneSchema";
import type { SubunitOption, SubunitValues } from "../types/subunitOptionsType";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  form: UseFormReturn<StepOneSchema>;
  subunitOption: SubunitOption;
  handleSubunitOption: (value: SubunitOption) => void;
  subunitOptions: SubunitValues;
};
function RadioButtons({
  form,
  subunitOption,
  handleSubunitOption,
  subunitOptions,
}: Props) {
  return (
    <Card className="rounded-none my-8 shadow-xl">
      <CardContent>
        <div className="flex justify-center items-center my-8">
          <RadioGroup.Root
            value={subunitOption}
            className="max-w-sm w-full grid grid-cols-3 gap-3"
            name="subunitOption"
            onValueChange={(value: SubunitOption) => {
              handleSubunitOption(value);
              form.setValue("subunit", value);
            }}
          >
            {subunitOptions.map((option) => (
              <RadioGroup.Item
                key={option}
                value={option}
                id={option}
                className="relative group ring-[1px] ring-border rounded py-1 px-3 data-[state=checked]:ring-2 data-[state=checked]:ring-pagopa-primary"
              >
                <CircleCheck className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 h-6 w-6 text-primary fill-pagopa-primary stroke-white group-data-[state=unchecked]:hidden" />
                <span className="font-semibold tracking-tight">{option}</span>
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
        </div>
      </CardContent>
    </Card>
  );
}
export default RadioButtons;
