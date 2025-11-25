import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  Button,
  Select,
} from "@repo/ui";
import { LoaderCircle } from "lucide-react";
import { OutputOption } from "../utils/constants";
import { useFormContext } from "../context/FormContext";
import { outputOptions } from "../utils/constants";

type Props = {
  isPending: boolean;
  outputOption: OutputOption;
  handleOutputOptionChange: (option: OutputOption) => void;
};

export const StepThreeControls = ({
  isPending,
  outputOption,
  handleOutputOptionChange,
}: Props) => {
  const { isFirstStep, prevStep } = useFormContext();

  const buttonText = outputOption === "clipboard" ? "Copia" : "Invia";

  return (
    <div className="flex justify-end gap-4 pt-8">
      <Button
        variant="outline"
        className="w-fit sm:w-32 hover: cursor-pointer"
        onClick={prevStep}
        disabled={isFirstStep}
        type="button"
      >
        Indietro
      </Button>

      <Select
        key={outputOption}
        name="output"
        value={outputOption}
        onValueChange={(value: OutputOption) => {
          handleOutputOptionChange(value);
        }}
      >
        <SelectTrigger className="bg-white ui:hover cursor-pointer disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none hover:cursor-pointer">
          <SelectValue placeholder="" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {outputOptions.map((option: OutputOption) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button
        variant={outputOption === "clipboard" ? "copied" : "pagopaprimary"}
        type="submit"
        className="w-fit sm:w-32"
      >
        {isPending ? (
          <LoaderCircle
            className="ui:animate-spin"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : (
          <span>{buttonText}</span>
        )}
      </Button>
    </div>
  );
};
