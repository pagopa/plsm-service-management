import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { uploadContract } from "../actions/uploadContract";
import ContractUpload from "./ContractUpload";
import Header from "./Header";
import StepFourPendingTable from "./StepFourPendingTable";
import { useFormContext } from "../context/FormContext";

const outputOptionsStepFour = ["uat", "prod"] as const;
export type OutputOptionsStepFour = (typeof outputOptionsStepFour)[number];

type Props = {
  children?: React.ReactNode;
};

function StepFour({ children }: Props) {
  const {
    goToStepOne,
    stepFourData,
    resetStepOneIsSubmitted,
    resetStepTwoIsSubmitted,
  } = useFormContext();

  const [outputOption, setOutputOption] =
    useState<OutputOptionsStepFour>("uat");

  const [files, setFiles] = useState<(File & { preview: string })[]>([]);

  const [contractState, contractAction, contractIsPending] = useActionState(
    uploadContract,
    null,
  );
  function handleFilesChange(files: (File & { preview: string })[]) {
    setFiles(files);
  }

  useEffect(() => {
    if (!contractState || contractIsPending) return;
    if (!contractState.success) {
      toast.error(contractState.message);
      return;
    }
    toast.success(contractState.message);
  }, [contractState, contractIsPending]);

  return (
    <div className="container flex flex-col  gap-8  max-w-3xl mx-auto ">
      {children}
      <Header {...stepFourData} />
      {stepFourData.dataTable && stepFourData.dataTable.length > 1 && (
        <Card className="rounded-none">
          <CardContent>
            <StepFourPendingTable data={stepFourData.dataTable} />
          </CardContent>
        </Card>
      )}

      {stepFourData.productId !== "" && (
        <Card className="shadow-2xl rounded-none">
          <CardHeader className="font-bold uppercase tracking-wider text-sm">
            <CardTitle>Carica il contratto</CardTitle>
          </CardHeader>
          <CardContent>
            <ContractUpload files={files} onFilesChange={handleFilesChange} />
          </CardContent>
        </Card>
      )}
      {files.length > 0 && (
        <form
          action={async () => {
            if (!files[0]) return;

            const formData = new FormData();
            formData.append("contract", files[0], files[0].name);
            formData.append("id", stepFourData.productId);
            formData.append("output", outputOption);

            return contractAction(formData);
          }}
        >
          <div className="flex justify-end mt-4 gap-4">
            <Select
              key={outputOption}
              name="output"
              value={outputOption}
              onValueChange={(value: OutputOptionsStepFour) => {
                setOutputOption(value);
              }}
            >
              <SelectTrigger className="ui:hover cursor-pointer disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none hover:cursor-pointer">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {outputOptionsStepFour.map(
                    (option: OutputOptionsStepFour) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ),
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              variant="pagopaprimary"
              type="submit"
              disabled={contractIsPending}
            >
              {contractIsPending ? (
                <LoaderCircle
                  className="ui:animate-spin"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              ) : (
                "Invia contratto"
              )}
            </Button>
          </div>
        </form>
      )}
      {contractState && contractState.success && (
        <div className="flex justify-end mt-4 gap-4">
          <Button
            variant="pagopaprimary"
            onClick={() => {
              resetStepOneIsSubmitted();
              resetStepTwoIsSubmitted();
              goToStepOne();
            }}
          >
            Nuovo onboarding
          </Button>
        </div>
      )}
    </div>
  );
}

export default StepFour;
