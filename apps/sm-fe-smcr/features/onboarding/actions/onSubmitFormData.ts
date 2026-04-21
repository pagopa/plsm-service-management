"use server";

import { $fetch } from "@/lib/fetch";
import logger from "@/lib/logger/logger.server";
import { getOnboardingStatusSchema } from "../types/getOnboardingStatusSchema";
import { onboardingSchema } from "../types/onboardingSchema";
import { productKeys, productsMap, OutputOption } from "../utils/constants";
import { generatePayload } from "../utils/generatePayload";
import {
  FE_SMCR_API_KEY_INSTITUTION,
  FE_SMCR_API_KEY_INSTITUTION_UAT,
  FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY,
  FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT,
  GET_STATUS,
  ONBOARDING_BASE_PATH,
  ONBOARDING_BASE_PATH_UAT,
  UPLOAD,
} from "./config/env";

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
      logger.warn(
        {
          info: {
            event: "onboarding.formData.parseError",
            actor: "smcr-ui",
            subject: "onboarding",
            metadata: { errors },
          },
        },
        "Onboarding form data validation failed",
      );

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
    logger.info(
      {
        info: {
          event: "onboarding.upload.response",
          actor: "smcr-ui",
          subject: "onboarding",
          metadata: {
            hasData: !!data,
            output,
            payload: generatePayload(dataFromUIParsed),
          },
        },
      },
      "Onboarding upload response",
    );
    if (error) {
      logger.error(
        {
          error: {
            name: "UploadError",
            message: error.message ?? "Onboarding upload failed",
            stack: undefined,
          },
          info: {
            event: "onboarding.upload.error",
            actor: "smcr-ui",
            subject: "onboarding",
            metadata: {
              status: error.status,
              statusText: error.statusText,
              output,
            },
          },
        },
        "Onboarding upload failed",
      );
      if (error.status === 409) {
        return {
          success: false,
          message: "Conflitto: Onboarding già effettuato",
        };
      }
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
          baseURL:
            output === "prod" ? ONBOARDING_BASE_PATH : ONBOARDING_BASE_PATH_UAT,
          headers: {
            "Ocp-Apim-Subscription-Key": `${output === "prod" ? FE_SMCR_API_KEY_INSTITUTION : FE_SMCR_API_KEY_INSTITUTION_UAT}`,
          },
          output: getOnboardingStatusSchema,
        },
      );
      logger.info(
        {
          info: {
            event: "onboarding.getStatus.response",
            actor: "smcr-ui",
            subject: "onboarding",
            metadata: {
              hasData: !!dataStatus,
              dataLength: dataStatus?.length ?? 0,
              hasError: !!errorStatus,
              taxcode: dataFromUIParsed.taxcode,
            },
          },
        },
        "GetOnboardingStatus response",
      );
      if (errorStatus) {
        logger.warn(
          {
            info: {
              event: "onboarding.getStatus.error",
              actor: "smcr-ui",
              subject: "onboarding",
              metadata: {
                status: errorStatus.status,
                message: errorStatus.message,
              },
            },
          },
          "GetOnboardingStatus failed",
        );
        if (errorStatus.status === 404) {
          return {
            success: false,
            message: errorStatus.message,
          };
        } else {
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
      logger.info(
        {
          info: {
            event: "onboarding.getStatus.data",
            actor: "smcr-ui",
            subject: "onboarding",
            metadata: {
              dataLength: dataStatus?.length ?? 0,
              productId: dataFromUIParsed.productId,
            },
          },
        },
        "GetOnboardingStatus data",
      );

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
      logger.info(
        {
          info: {
            event: "onboarding.submit.completed",
            actor: "smcr-ui",
            subject: "onboarding",
            metadata: {
              dataTableLength: dataTable?.length ?? 0,
              productId: dataFromUIParsed.productId,
            },
          },
        },
        "onSubmitFormData completed",
      );
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
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(
        {
          error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
          },
          info: {
            event: "onboarding.getStatus.exception",
            actor: "smcr-ui",
            subject: "onboarding",
            metadata: { taxcode: dataFromUIParsed.taxcode },
          },
        },
        "GetOnboardingStatus exception",
      );
      return {
        success: false,
        message: `Onboarding riuscito ma GetOnboardingStatus non riuscito, Errore: \n ${JSON.stringify(error)}`,
      };
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(
      {
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
        info: {
          event: "onboarding.submit.exception",
          actor: "smcr-ui",
          subject: "onboarding",
          metadata: {},
        },
      },
      "Onboarding submit failed",
    );
    return {
      success: false,
      message: `Onboarding non riuscito, errore: \n ${JSON.stringify(error)}`,
    };
  }
}
