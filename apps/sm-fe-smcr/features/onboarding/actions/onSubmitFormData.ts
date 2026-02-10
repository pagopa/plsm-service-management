"use server";

import { $fetch } from "@/lib/fetch";
import { getOnboardingStatusSchema } from "../types/getOnboardingStatusSchema";
import { onboardingSchema } from "../types/onboardingSchema";
import { productKeys, productsMap, OutputOption } from "../utils/constants";
import { generatePayload } from "../utils/generatePayload";

const FE_SMCR_API_KEY_INSTITUTION = process.env.FE_SMCR_API_KEY_INSTITUTION;
const FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY =
  process.env.FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY;
const FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT =
  process.env.FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT;
const GET_STATUS = process.env.GET_STATUS;
const UPLOAD = process.env.UPLOAD ?? "";
const ONBOARDING_BASE_PATH = process.env.ONBOARDING_BASE_PATH;
const ONBOARDING_BASE_PATH_UAT = process.env.ONBOARDING_BASE_PATH_UAT;

export async function onSubmitFormData(state: any, formData: FormData) {
  const output = formData.get("output") as OutputOption;

  if (output === "clipboard") {
    return { success: false, message: "clipboard not supported" };
  }
  const dataFromUI = formData.get("data") as string;

  if (!dataFromUI) {
    return { success: false, message: "nessun dato da inviare" };
  }
  try {
    const { data: dataFromUIParsed, error: parseError } =
      onboardingSchema.safeParse(JSON.parse(dataFromUI));

    if (parseError) {
      const errors: Record<string, { message: string }> = {};
      for (const { path, message } of parseError?.issues ?? []) {
        errors[path.join(".")] = { message };
      }
      console.log(errors);

      let result = "";
      for (const [key, value] of Object.entries(errors)) {
        result += `${key}: ${value.message}\n`;
      }
      return {
        success: false,
        message: `Errore: \n ${result}`,
      };
    }

    const { data, error } = await $fetch(UPLOAD, {
      method: "POST",
      baseURL:
        output === "prod" ? ONBOARDING_BASE_PATH : ONBOARDING_BASE_PATH_UAT,
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": `${output === "prod" ? FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY : FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT}`,
      },
      body: JSON.stringify(generatePayload(dataFromUIParsed)),
    });
    console.log("DATA: ", data);
    if (error) {
      console.error(error);
      return {
        success: false,
        message: "Onboarding non riuscito.",
      };
    }

    const isSubunit =
      dataFromUIParsed.subunit === "AOO" || dataFromUIParsed.subunit === "UO";

    try {
      const { data: dataStatus, error: errorStatus } = await $fetch(
        `${GET_STATUS}?taxcode=${dataFromUIParsed.taxcode}${isSubunit ? `&subunitCode=${dataFromUIParsed.subunitCode}` : ""}`,
        {
          method: "GET",
          baseURL: ONBOARDING_BASE_PATH,
          headers: {
            "Ocp-Apim-Subscription-Key": `${FE_SMCR_API_KEY_INSTITUTION}`,
          },
          output: getOnboardingStatusSchema,
        },
      );
      console.log({ dataStatus, errorStatus });

      if (errorStatus) {
        if (errorStatus.status === 404) {
          return {
            success: false,
            message: errorStatus.message,
          };
        } else {
          console.log(errorStatus);
          return {
            success: false,
            message: `Onbording effettuato con successo ma GetOnboardingStatus è fallita: ${JSON.stringify(errorStatus)}`,
          };
        }
      }
      if (!dataStatus || dataStatus.length === 0) {
        return {
          success: false,
          message:
            "Onbording effettuato con successo ma GetOnboardingStatus non ha ritornato nessun record.",
        };
      }
      console.log({ dataStatus });
      console.log("dataFromUIParsed.productId", dataFromUIParsed.productId);

      const dataTable = dataStatus
        ?.map((el) => {
          return {
            productId: el.id,
            product: el.productId,
            workflowType: el.workflowType,
            status: el.status,
            updatedAt: el.updatedAt,
            createdAt: el.createdAt,
            taxcode: dataFromUIParsed.taxcode,
            subunitCode: dataFromUIParsed.subunitCode,
            subunit: dataFromUIParsed.subunit,
            businessName: dataFromUIParsed.businessName,
          };
        })
        .filter((el) => el.workflowType !== "USERS")
        .filter((el) => (productKeys as unknown as string).includes(el.product))
        .filter(
          (el) =>
            el.product === dataFromUIParsed.productId &&
            el.status === "PENDING",
        );
      console.log("onSubmitFormData");
      console.log({ dataTable });
      if (!dataTable || dataTable.length === 0) {
        return {
          success: false,
          message: `Onbording effettuato con successo ma GetOnboardingStatus non ritorna nessun record in stato PENDING per il prodotto ${productsMap.get(dataFromUIParsed.productId)}.`,
        };
      }
      if (dataTable.length === 1) {
        return {
          success: true,
          message: "Onbording effettuato con successo!",
          data: {
            product: dataFromUIParsed.productId,
            productId: dataTable[0]?.productId,
            taxcode: dataFromUIParsed.taxcode,
            subunit: dataFromUIParsed.subunit,
            subunitCode: dataFromUIParsed.subunitCode,
            businessName: dataFromUIParsed.businessName,
            dataTable,
          },
        };
      } else {
        return {
          success: true,
          message: "Onbording effettuato con successo!",
          data: {
            product: dataFromUIParsed.productId,
            productId: "",
            taxcode: dataFromUIParsed.taxcode,
            subunit: dataFromUIParsed.subunit,
            subunitCode: dataFromUIParsed.subunitCode,
            businessName: dataFromUIParsed.businessName,
            dataTable,
          },
        };
      }
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: `Onboarding riuscito ma GetOnboardingStatus non riuscito, Errore: \n ${JSON.stringify(error)}`,
      };
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: `Onboarding non riuscito, errore: \n ${JSON.stringify(error)}`,
    };
  }
}
