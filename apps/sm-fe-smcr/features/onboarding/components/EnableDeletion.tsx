import { Checkbox } from "@/components/ui/checkbox";
import { useStepOneContext } from "../context/StepOneContext";

export function EnableDeletion() {
  const { isDeleteOn, handleDeleteOn, dataTable } = useStepOneContext();
  const isCompletedStatusPresent = dataTable?.some(
    (item) => item.status === "COMPLETED",
  );
  return (
    <>
      {isCompletedStatusPresent && (
        <div className="flex items-center space-x-2 ">
          <Checkbox
            checked={isDeleteOn}
            onCheckedChange={handleDeleteOn}
            id="isDeleteOn"
            className="peer disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
          />
          <label
            htmlFor="isDeleteOn"
            className="text-sm font-medium leading-none peer-disabled:text-accent  "
          >
            Abilita Cancella
          </label>
        </div>
      )}
    </>
  );
}
