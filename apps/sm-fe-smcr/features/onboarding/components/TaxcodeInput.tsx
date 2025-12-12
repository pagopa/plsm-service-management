import { Card, CardContent } from "@/components/ui/card";
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  Select,
  SelectLabel,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
import { ApiOptionsApicale } from "../types/apiOptionsType";
import { apiOptionsApicale } from "../utils/constants";
import { UseFormReturn } from "react-hook-form";
import { StepOneSchema } from "../types/stepOneSchema";
import { useFormContext } from "../context/FormContext";
type Props = {
  form: UseFormReturn<StepOneSchema>;
  taxCode: string;
  subunitCode: string | undefined;
  isApicale: boolean;
  apiOption: ApiOptionsApicale;
  handleApiOption: (option: ApiOptionsApicale) => void;
  isPending: boolean;
};

export const TaxcodeInput = ({
  form,
  taxCode,
  subunitCode,
  isApicale,
  apiOption,
  handleApiOption,
  isPending,
}: Props) => {
  const { isStepThree } = useFormContext();
  return (
    <>
      <Card className="rounded-none shadow-xl ui:bg-pagopa-primary border-none">
        <CardContent>
          <div
            className={cn(
              "flex  gap-2 py-8  items-center justify-between",
              !isStepThree && "ui:bg-pagopa-primary ui:text-white ",
            )}
          >
            <div className="shrink-0">
              <Label
                htmlFor={isApicale ? "taxcode" : "subunitCode"}
                id={isApicale ? "taxcode" : "subunitCode"}
              >
                {isApicale ? "Codice fiscale" : "Codice univoco"}
              </Label>
            </div>
            <div className="basis-full ">
              {isApicale ? (
                <Input
                  disabled={isStepThree}
                  name="taxcode"
                  id="taxcode"
                  type="text"
                  className=" disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                  value={taxCode}
                  onChange={(event) => {
                    event.preventDefault();
                    form.setValue("taxcode", event.target.value, {
                      shouldValidate: form.formState.isSubmitted,
                    });
                  }}
                />
              ) : (
                <Input
                  disabled={isStepThree}
                  name="subunitCode"
                  id="subunitCode"
                  type="text"
                  className=" disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                  value={subunitCode}
                  onChange={(event) => {
                    event.preventDefault();
                    form.setValue("subunitCode", event.target.value, {
                      shouldValidate: form.formState.isSubmitted,
                    });
                  }}
                />
              )}
            </div>

            {!isStepThree && (
              <div className="flex gap-2">
                {isApicale && (
                  <div className="flex flex-col">
                    <Label htmlFor="api-select" className="hidden">
                      API
                    </Label>
                    <Select
                      key={apiOption}
                      disabled={isStepThree}
                      name="endpoint"
                      value={apiOption}
                      onValueChange={(value: ApiOptionsApicale) => {
                        handleApiOption(value);
                      }}
                    >
                      <SelectTrigger
                        id="api-select"
                        className="ui:hover cursor-pointer disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none hover:cursor-pointer"
                      >
                        <SelectValue placeholder="Seleziona API" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>APIs disponibili</SelectLabel>
                          {apiOptionsApicale.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="text-black">
                  <Button
                    className="w-fit sm:w-32"
                    disabled={isStepThree}
                    variant="outline"
                    type="submit"
                    aria-label={
                      isPending ? "Ricerca in corso..." : "Cerca ente"
                    }
                  >
                    {isPending ? (
                      <LoaderCircle
                        className="ui:animate-spin mr-2"
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    ) : (
                      "Cerca"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {isApicale && form.formState.errors.taxcode ? (
        <p className="ui:text-destructive ui:text-sm ui:mt-2 ui:text-center">
          {form.formState.errors.taxcode?.message}
        </p>
      ) : (
        <p className="ui:text-destructive ui:text-sm ui:mt-2 ui:text-center">
          {form.formState.errors.subunitCode?.message}
        </p>
      )}
    </>
  );
};
