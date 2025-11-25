import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { setupZodErrors } from "@/features/onboarding/utils/zodErrors";
import React, {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { verifyTaxCode } from "../actions/verifyTaxCode";
import { StepOneContext } from "../context/StepOneContext";
import type { ApiOptionsApicale } from "../types/apiOptionsType";
import { ProductStatus } from "../types/productStatus";
import { ProductOptions } from "../types/productType";
import {
  defaultValues,
  stepOneSchema,
  StepOneSchema,
} from "../types/stepOneSchema";
import { SubunitOption } from "../types/subunitOptionsType";
import {
  apicale_infocamere_stepOne_map,
  apicale_ipa_stepOne_map,
  apicale_selfcare_stepOne_map,
  apiOptionsApicale,
  ipaAOO_stepOne_map,
  ipaUO_stepOne_map,
  productKeys,
  productOptions,
  subunitValues,
} from "../utils/constants";
import {
  isApicaleInfoCamereData,
  isApicaleIpaData,
  isApicaleSelfCareData,
  isIpaAOOData,
  isIpaUOData,
} from "../utils/helpers";
import Header from "./Header";
import StepOneTwoControls from "./StepOneTwoControls";
import { IdentificationData } from "./stepOne/IdentificationData";
import { ProductData } from "./stepOne/ProductData";
import { GeographicData } from "./stepOne/GeographicData";
import { PersonalData } from "./stepOne/PersonalData";
import { PspData } from "./stepOne/PspData";
import { AdditionalData } from "./stepOne/AdditionalData";
import { Product } from "./stepOne/Product";
import { SearchForm } from "./SearchForm";
import { OnboardingStatusTable } from "./OnboardingStatusTable";
import { useFormContext } from "../context/FormContext";
import { getStepOneData } from "../utils/getStepData";
import { Form } from "@/components/ui/form";

type Props = {
  style?: React.CSSProperties;
  children?: React.ReactNode;
};
function cleanAddress(address: string) {
  return address.replace(/null/g, "").trim();
}

function StepOne({ children, ...props }: Props) {
  const {
    isStepThree,
    nextStep,
    formData,
    updateFormData,
    isStepOneSubmitted,
    handleStepOneSubmit,
  } = useFormContext();

  const [productOptionsToDisplay, setProductOptionsToDisplay] =
    useState<ProductOptions>(productOptions);
  const [dataTable, setDataTable] = useState<ProductStatus[] | undefined>(
    undefined,
  );

  const [apiOption, setApiOption] = useState<ApiOptionsApicale>(
    apiOptionsApicale[0],
  );
  const [subunitOption, setSubunitOption] = useState<SubunitOption>(
    subunitValues[0],
  );
  const [isDeleteOn, setIsDeleteOn] = useState(false);

  function handleDeleteOn(value: boolean) {
    setIsDeleteOn(value);
  }

  const formRef = useRef<HTMLFormElement>(null);
  function handleDataTable(data: ProductStatus[] | undefined) {
    setDataTable(data);
  }
  function resetDataTable() {
    setDataTable(undefined);
  }

  const handleSubunitOption = useCallback((value: SubunitOption) => {
    setSubunitOption(value);
  }, []);
  const handleApiOption = useCallback((value: ApiOptionsApicale) => {
    setApiOption(value);
  }, []);

  const form = useForm<StepOneSchema>({
    resolver: zodResolver(stepOneSchema),
    mode: "all",
    defaultValues: isStepOneSubmitted
      ? getStepOneData(formData)
      : defaultValues,
  });
  setupZodErrors();
  function handleProductOptions(data: ProductOptions) {
    setProductOptionsToDisplay(data);
  }
  function resetProductOptions() {
    setProductOptionsToDisplay(productOptions);
  }

  const institutionType = form.watch("institutionType");
  const productId = form.watch("productId");
  const taxCode = form.watch("taxcode");
  const subunitCode = form.watch("subunitCode");
  const isPIVANull = form.watch("isPIVANull");
  const isPIVAequalToTaxcode = form.watch("isPIVAequalToTaxcode");

  const isPSP = institutionType === "PSP";
  const isAdditionalInformation =
    institutionType === "GSP" && productId === productKeys[0];
  const isSubunit = subunitOption === "AOO" || subunitOption === "UO";
  const isApicale = subunitOption === "Apicale";

  function onSubmit(values: StepOneSchema) {
    if (!isStepThree && updateFormData) {
      updateFormData(values);
      handleStepOneSubmit();
      nextStep();
    }
  }
  function isBothPendingAndCompleted(
    dataStatus: ProductStatus[],
    product: string,
  ): boolean {
    const p = dataStatus.filter((el) => el.product === product);
    const isCompleted = p.some((el) => el.status === "COMPLETED");
    const isPending = p.some((el) => el.status === "PENDING");
    return isCompleted && isPending;
  }

  const [state, action, isPending] = useActionState(verifyTaxCode, null);

  useEffect(() => {
    if (isPIVAequalToTaxcode) {
      form.setValue("vatNumber", taxCode);
      form.trigger("vatNumber");
    }
  }, [isPIVAequalToTaxcode, taxCode, form]);

  useEffect(() => {
    if (!isSubunit) return;
    form.setValue("subunitType", subunitOption);
  }, [subunitOption, form, isSubunit]);

  useEffect(() => {
    if (!state || isPending) return;
    if (!state.success || !state.data) {
      toast.error(state.message);
      return;
    }
    function allowedProducts(dataStatus: ProductStatus[]) {
      const nonActiveContracts = productOptions.reduce(
        (acc: ProductOptions, item) => {
          if (
            dataStatus.find(
              (el) =>
                el.product === item.tag &&
                (el.status === "COMPLETED" ||
                  isBothPendingAndCompleted(dataStatus, item.tag)),
            )
          ) {
            return [...acc];
          } else {
            return [...acc, item];
          }
        },
        [],
      );
      return nonActiveContracts;
    }

    const { data, endpoint, subunit, dataStatus } = state;
    if (!dataStatus) return;
    handleDataTable(dataStatus);

    switch (subunit) {
      case "AOO":
        if (isIpaAOOData(data, subunit)) {
          for (const [key, value] of ipaAOO_stepOne_map) {
            if (data[value]) {
              if (value === "indirizzo") {
                form.setValue(key, cleanAddress(data[value]));
              } else {
                form.setValue(key, data[value]);
              }
            }
          }
          form.setValue("subunit", "AOO");
          form.setValue("subunitType", "AOO");

          if (dataStatus.length > 0) {
            const nonActiveContracts = allowedProducts(dataStatus);

            handleProductOptions(nonActiveContracts);
            if (nonActiveContracts.length === 0) {
              toast.error("L'ente ha sottoscritto tutti i prodotti attivi.");
              return;
            }
          }
        } else {
          toast.error("subunit not supported");
          return;
        }
        break;

      case "UO":
        if (isIpaUOData(data, subunit)) {
          for (const [key, value] of ipaUO_stepOne_map) {
            if (data[value]) {
              if (value === "indirizzo") {
                form.setValue(key, cleanAddress(data[value]));
              } else {
                form.setValue(key, data[value]);
              }
            }
          }
          form.setValue("subunit", "UO");
          form.setValue("subunitType", "UO");

          if (dataStatus.length > 0) {
            const nonActiveContracts = allowedProducts(dataStatus);

            handleProductOptions(nonActiveContracts);
            if (nonActiveContracts.length === 0) {
              toast.error("L'ente ha sottoscritto tutti i prodotti attivi.");
              return;
            }
          }
        } else {
          toast.error("subunit not supported");
          return;
        }
        break;
      case "Apicale":
        if (isApicaleSelfCareData(data, endpoint)) {
          if (data.institutions.length === 0) {
            toast.error("Ente non trovato");
            return;
          } else {
            const institution = data.institutions[0];
            if (!institution) return;
            for (const [key, value] of apicale_selfcare_stepOne_map) {
              if (value === "address") {
                form.setValue(key, cleanAddress(institution[value]));
              } else {
                form.setValue(key, institution[value]);
              }
            }
            form.setValue("subunit", "Apicale");
            if (dataStatus.length > 0) {
              const nonActiveContracts = allowedProducts(dataStatus);

              handleProductOptions(nonActiveContracts);
              if (nonActiveContracts.length === 0) {
                toast.error("L'ente ha sottoscritto tutti i prodotti attivi.");
                return;
              }
            }
            if (institution.onboarding.length > 0) {
              const firstOnboarding = institution.onboarding[0];
              if (firstOnboarding) {
                form.setValue(
                  "institutionType",
                  firstOnboarding.institutionType,
                );
              }
            }
            if (institution.geographicTaxonomies) {
              form.setValue(
                "code",
                institution.geographicTaxonomies.at(0)?.code,
              );
              form.setValue(
                "desc",
                institution.geographicTaxonomies.at(0)?.desc,
              );
            }
            if (data.paymentServiceProvider) {
              form.setValue("abiCode", data.paymentServiceProvider.abiCode);
              form.setValue(
                "businessRegisterNumber",
                data.paymentServiceProvider.businessRegisterNumber,
              );
              form.setValue(
                "legalRegisterNumber",
                data.paymentServiceProvider.legalRegisterNumber,
              );
              form.setValue(
                "vatNumberGroup",
                data.paymentServiceProvider.vatNumberGroup,
              );
            }
          }
        }
        if (isApicaleIpaData(data, endpoint)) {
          const origin = form.getValues("origin");
          for (const [key, value] of apicale_ipa_stepOne_map) {
            if (data[value]) {
              if (value === "address") {
                form.setValue(key, cleanAddress(data[value]));
              } else {
                form.setValue(key, data[value]);
              }
            }
          }
          form.setValue("origin", origin);

          if (dataStatus.length > 0) {
            const nonActiveContracts = allowedProducts(dataStatus);

            handleProductOptions(nonActiveContracts);
            if (nonActiveContracts.length === 0) {
              toast.error("L'ente ha sottoscritto tutti i prodotti attivi.");
              return;
            }
          }
        }
        if (isApicaleInfoCamereData(data, endpoint)) {
          const taxcode = form.getValues("taxcode");
          for (const [key, value] of apicale_infocamere_stepOne_map) {
            if (data[value]) {
              if (value === "address") {
                form.setValue(key, cleanAddress(data[value]));
              } else {
                form.setValue(key, data[value]);
              }
            }
          }
          form.setValue("taxcode", taxcode);

          if (dataStatus.length > 0) {
            const nonActiveContracts = allowedProducts(dataStatus);

            handleProductOptions(nonActiveContracts);
            if (nonActiveContracts.length === 0) {
              toast.error("L'ente ha sottoscritto tutti i prodotti attivi.");
              return;
            }
          }
        }
        break;

      default:
        throw new Error(`unknown subunit ${subunit}`);
    }

    form.trigger();
    toast.success("Dati caricati!");
  }, [state, isPending, form]);

  return (
    <StepOneContext
      value={{
        formRef,
        form,
        handleSubunitOption,
        handleApiOption,
        isDeleteOn,
        handleDeleteOn,
        dataTable,
      }}
    >
      <div {...props}>
        {!isStepThree && (
          <SearchForm
            resetProductOptions={resetProductOptions}
            resetDataTable={resetDataTable}
            taxCode={taxCode}
            subunitCode={subunitCode}
            isApicale={isApicale}
            apiOption={apiOption}
            isPending={isPending}
            action={action}
            subunitOption={subunitOption}
          />
        )}
        {dataTable && <OnboardingStatusTable dataTable={dataTable} />}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 max-w-3xl mx-auto pb-10 "
          >
            {isApicale ? (
              <input type="hidden" value="" name="taxcode" />
            ) : (
              <input type="hidden" value="" name="subunitCode" />
            )}
            <input type="hidden" value="" name="subunit" />
            {isStepThree && (
              <Header
                taxcode={formData.taxcode}
                businessName={formData.businessName}
                product={formData.productId ?? ""}
                subunit={formData.subunit}
                subunitCode={formData.subunitCode}
              />
            )}
            {!isStepThree && (
              <Product productOptionsToDisplay={productOptionsToDisplay} />
            )}
            {children}
            <PersonalData
              isPIVANull={isPIVANull}
              isPIVAequalToTaxcode={isPIVAequalToTaxcode}
              productId={productId}
              isSubunit={isSubunit}
            />
            <GeographicData />
            <ProductData />
            <IdentificationData />

            {isPSP && <PspData />}
            {isAdditionalInformation && <AdditionalData />}
            {!isStepThree && (
              <StepOneTwoControls
                form={form}
                handleDataTable={handleDataTable}
                handleDeleteOn={handleDeleteOn}
                resetProductOptions={resetProductOptions}
              />
            )}
          </form>
        </Form>
      </div>
    </StepOneContext>
  );
}

export default StepOne;
