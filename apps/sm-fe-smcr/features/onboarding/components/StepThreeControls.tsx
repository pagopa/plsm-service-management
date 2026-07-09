import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { useFormContext } from "../context/FormContext";

type Props = {
  isPending: boolean;
  onCopy: () => void;
};

export const StepThreeControls = ({ isPending, onCopy }: Props) => {
  const { isFirstStep, prevStep } = useFormContext();

  return (
    <div className="flex justify-between gap-4 pt-8">
      <Button
        variant="outline"
        className="w-fit sm:w-32 hover:cursor-pointer"
        onClick={prevStep}
        disabled={isFirstStep}
        type="button"
      >
        Indietro
      </Button>

      <div className="flex gap-4">
        <Button
          variant="copied"
          type="button"
          className="w-fit sm:w-32 hover:cursor-pointer"
          onClick={onCopy}
          disabled={isPending}
        >
          Copia
        </Button>

        <Button
          variant="pagopaprimary"
          type="submit"
          className="w-fit sm:w-32 hover:cursor-pointer"
          disabled={isPending}
        >
          {isPending ? (
            <LoaderCircle
              className="ui:animate-spin"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
          ) : (
            <span>Invia</span>
          )}
        </Button>
      </div>
    </div>
  );
};
