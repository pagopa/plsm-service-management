"use server";

import {
  AOO_CODE_LENGTH,
  productKeys,
  TAXCODE_BUSINESS_LENGTH,
  UO_CODE_LENGTH,
} from "../utils/constants";

import { getSelfCareSchema } from "@/features/onboarding/types/getSelfCareSchema";

import { getIpaSchemaAOO } from "../types/getIpaSchemaAOO";
import { getIpaSchemaUO } from "../types/getIpaSchemaUO";
import { $fetch } from "@/lib/fetch";
import { ApiOptionsApicale } from "../types/apiOptionsType";
import { getInfocamereSchema } from "../types/getInfocamereSchema";
import { getIpaSchema } from "../types/getIpaSchema";
import { getOnboardingStatusSchema } from "../types/getOnboardingStatusSchema";
import { SubunitOption } from "../types/subunitOptionsType";
import { isIpaAOOData, isIpaUOData } from "../utils/helpers";
import { isEmptyObj } from "../utils/isNotEmptyObj";
import {
  FE_SMCR_API_KEY_INSTITUTION,
  FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY,
  GET_INFOCAMERE,
  GET_INSTITUTION,
  GET_IPA,
  GET_IPA_AOO,
  GET_IPA_UO,
  GET_STATUS,
  ONBOARDING_BASE_PATH,
} from "./config/env";

export async function verifyTaxCode(state: any, formData: FormData) {
  const subunit = formData.get("subunitOption") as SubunitOption;
  console.log({ subunit });
  let codeToSearch = "";

  switch (subunit) {
    case "AOO": {
      const subunitCodeAOOFormData = formData.get("subunitCode") as string;
      const subunitCodeAOO = subunitCodeAOOFormData.trim().toUpperCase();
      if (subunitCodeAOO.length !== AOO_CODE_LENGTH) {
        return {
          success: false,
          subunitCodeAOO,
          message: `il codice univoco deve avere ${AOO_CODE_LENGTH} caratteri`,
        };
      } else {
        codeToSearch = subunitCodeAOO;
      }
      break;
    }
    case "UO": {
      const subunitCodeUOFormData = formData.get("subunitCode") as string;
      const subunitCodeUO = subunitCodeUOFormData.trim().toUpperCase();
      if (subunitCodeUO.length !== UO_CODE_LENGTH) {
        return {
          success: false,
          subunitCodeUO,
          message: `il codice univoco deve avere ${UO_CODE_LENGTH} caratteri`,
        };
      } else {
        codeToSearch = subunitCodeUO;
      }

      break;
    }
    case "Apicale": {
      const taxCodeFormData = formData.get("taxcode") as string;
      const taxCode = taxCodeFormData.trim().toUpperCase();

      if (taxCode.length !== TAXCODE_BUSINESS_LENGTH) {
        return {
          success: false,
          taxCode,
          message: `il codice fiscale deve avere ${TAXCODE_BUSINESS_LENGTH} caratteri`,
        };
      } else {
        codeToSearch = taxCode;
      }
      break;
    }

    default:
      throw new Error(`subunit non trovata ${subunit satisfies never}`);
  }

  function fetchConfig(code: string, subunit: SubunitOption) {
    if (subunit === "AOO" || subunit === "UO") {
      return {
        apikey: `${FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY}`,
        schema: subunit === "AOO" ? getIpaSchemaAOO : getIpaSchemaUO,
        url: `${subunit === "AOO" ? GET_IPA_AOO : GET_IPA_UO}${code}`,
      };
    }
    const endpoint = formData.get("endpoint") as ApiOptionsApicale;
    switch (endpoint) {
      case "selfcare":
        return {
          apikey: `${FE_SMCR_API_KEY_INSTITUTION}`,
          schema: getSelfCareSchema,
          url: `${GET_INSTITUTION}?taxCode=${code}`,
          endpoint,
        };
      case "ipa":
        return {
          apikey: `${FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY}`,
          schema: getIpaSchema,
          url: `${GET_IPA}${code}`,
          endpoint,
        };
      case "infocamere":
        return {
          apikey: `${FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY}`,
          schema: getInfocamereSchema,
          url: `${GET_INFOCAMERE}${code}`,
          endpoint,
        };

      default:
        throw new Error(`endpoint non valido: ${endpoint satisfies never}`);
    }
  }
  const { url, schema, apikey, endpoint } = fetchConfig(codeToSearch, subunit);
  try {
    const { data, error } = await $fetch(url, {
      method: "GET",
      baseURL: ONBOARDING_BASE_PATH,
      headers: {
        "Ocp-Apim-Subscription-Key": apikey,
      },
      output: schema,
    });
    console.log({ data, error });

    if (error) {
      if (error.status === 404) {
        return {
          success: false,
          code: codeToSearch,
          message: "Ente non trovato",
        };
      } else {
        console.log(error);
        return {
          success: false,
          code: codeToSearch,
          message: "Ente non trovato",
        };
      }
    }

    if (!data || isEmptyObj(data)) {
      return {
        success: false,
        code: codeToSearch,
        message: "Dati non trovati",
      };
    }
    console.log(data);
    if (isIpaAOOData(data, subunit) || isIpaUOData(data, subunit)) {
      const subunitCode = formData.get("subunitCode") as string;
      try {
        const { data: dataStatus, error: errorStatus } = await $fetch(
          `${GET_STATUS}?taxcode=${data.codiceFiscaleEnte}&subunitCode=${subunitCode}`,
          {
            method: "GET",
            baseURL: ONBOARDING_BASE_PATH,
            headers: {
              "Ocp-Apim-Subscription-Key": `${FE_SMCR_API_KEY_INSTITUTION}`,
            },
            output: getOnboardingStatusSchema,
          },
        );
        if (errorStatus) {
          if (errorStatus.status === 404) {
            return {
              success: false,
              code: codeToSearch,
              message: `GetInstitution è andata a buon fine ma GetOnboardingStatus ha dato il seguente errore: ${errorStatus.statusText}`,
            };
          } else {
            console.log(errorStatus);
            return {
              success: false,
              code: codeToSearch,
              message: `GetInstitution è andata a buon fine ma GetOnboardingStatus ha dato il seguente errore: ${JSON.stringify(
                errorStatus,
              )}`,
            };
          }
        }

        const dataTable = dataStatus
          ?.map((el) => {
            return {
              id: el.id,
              product: el.productId,
              workflowType: el.workflowType,
              status: el.status,
              updatedAt: el.updatedAt,
              createdAt: el.createdAt,
              taxcode: data.codiceFiscaleEnte,
              subunitCode,
              subunit,
              businessName: el.institution.description,
              endpoint: endpoint as ApiOptionsApicale,
            };
          })
          .filter((el) => el.workflowType !== "USERS")
          .filter((el) =>
            (productKeys as unknown as string).includes(el.product),
          );
        console.log("verifyTaxCode");
        console.log({ dataTable });

        return {
          success: true,
          code: codeToSearch,
          data,
          subunit,
          endpoint,
          dataStatus: dataTable,
        };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          code: codeToSearch,
          message: `Errore:\n ${JSON.stringify(error)}`,
        };
      }
    } else {
      try {
        const { data: dataStatus, error: errorStatus } = await $fetch(
          `${GET_STATUS}?taxcode=${codeToSearch}`,
          {
            method: "GET",
            baseURL: ONBOARDING_BASE_PATH,
            headers: {
              "Ocp-Apim-Subscription-Key": `${FE_SMCR_API_KEY_INSTITUTION}`,
            },
            output: getOnboardingStatusSchema,
          },
        );
        if (errorStatus) {
          if (errorStatus.status === 404) {
            return {
              success: false,
              code: codeToSearch,
              message: `GetInstitution è andata a buon fine ma GetOnboardingStatus ha dato il seguente errore: ${errorStatus.statusText}`,
            };
          } else {
            console.log(errorStatus);
            return {
              success: false,
              code: codeToSearch,
              message: `GetInstitution è andata a buon fine ma GetOnboardingStatus ha dato il seguente errore: ${JSON.stringify(
                errorStatus,
              )}`,
            };
          }
        }

        const dataTable = dataStatus
          ?.map((el) => {
            return {
              id: el.id,
              product: el.productId,
              workflowType: el.workflowType,
              status: el.status,
              updatedAt: el.updatedAt,
              createdAt: el.createdAt,
              taxcode: codeToSearch,
              subunitCode: "",
              subunit,
              businessName: el.institution.description,
              endpoint: endpoint as ApiOptionsApicale,
            };
          })
          .filter((el) => el.workflowType !== "USERS")
          .filter((el) =>
            (productKeys as unknown as string).includes(el.product),
          );
        console.log("verifyTaxCode");
        console.log({ dataTable });
        return {
          success: true,
          code: codeToSearch,
          data,
          subunit,
          endpoint,
          dataStatus: dataTable,
        };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          code: codeToSearch,
          message: `Errore:\n ${JSON.stringify(error)}`,
        };
      }
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      code: codeToSearch,
      message: `Errore:\n ${JSON.stringify(error)}`,
    };
  }
}
