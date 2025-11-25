import { ApiOptionsApicale } from "../types/apiOptionsType";
import { defaultValues } from "../types/stepOneSchema";
import { SubunitOption } from "../types/subunitOptionsType";
import { subunitValues } from "../utils/constants";
import RadioButtons from "./RadioButtons";
import { TaxcodeInput } from "./TaxcodeInput";
import { useStepOneContext } from "../context/StepOneContext";

type Props = {
  resetProductOptions: () => void;
  resetDataTable: () => void;
  taxCode: string;
  subunitCode: string | undefined;
  isApicale: boolean;
  apiOption: ApiOptionsApicale;
  isPending: boolean;
  action: (data: FormData) => void;
  subunitOption: SubunitOption;
};

export const SearchForm = ({
  resetProductOptions,
  resetDataTable,
  taxCode,
  subunitCode,
  isApicale,
  apiOption,
  isPending,
  action,
  subunitOption,
}: Props) => {
  const { form, formRef, handleSubunitOption, handleApiOption } =
    useStepOneContext();

  return (
    <form
      ref={formRef}
      action={async (data) => {
        form.reset(defaultValues);
        resetProductOptions();
        resetDataTable();
        return action(data);
      }}
      className="mb-8"
    >
      <RadioButtons
        form={form}
        subunitOption={subunitOption}
        subunitOptions={subunitValues}
        handleSubunitOption={handleSubunitOption}
      />
      <TaxcodeInput
        form={form}
        taxCode={taxCode}
        subunitCode={subunitCode}
        isApicale={isApicale}
        apiOption={apiOption}
        handleApiOption={handleApiOption}
        isPending={isPending}
      />
    </form>
  );
};
