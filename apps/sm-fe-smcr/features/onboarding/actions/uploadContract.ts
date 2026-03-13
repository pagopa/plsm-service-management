"use server";

import logger from "@/lib/logger/logger.server";
import { OutputOptionsStepFour } from "../components/StepFour";
import {
  FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY,
  FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT,
  ONBOARDING_BASE_PATH,
  ONBOARDING_BASE_PATH_UAT,
  UPLOAD,
} from "./config/env";

export async function uploadContract(state: any, formData: FormData) {
  const contract = formData.get("contract") as File;
  const id = (formData.get("id") as string) || "1";
  const output = formData.get("output") as OutputOptionsStepFour;

  if (!contract || !id || !output) {
    return {
      success: false,
      message: "File o ID o output mancanti",
    };
  }

  formData.delete("id");

  const baseURL =
    output === "prod" ? ONBOARDING_BASE_PATH : ONBOARDING_BASE_PATH_UAT;
  const url = `${baseURL}${UPLOAD}/${id}/consume`;
  const subscriptionKey =
    output === "prod"
      ? FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY
      : FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/problem+json",
        "Ocp-Apim-Subscription-Key": subscriptionKey ?? "",
      },
      body: formData,
    });

    if (!response.ok) {
      let message = "Upload fallito";
      const errorBody = await response.text();
      try {
        const parsed = JSON.parse(errorBody) as {
          detail?: string;
          title?: string;
        };
        message = parsed.detail ?? parsed.title ?? (errorBody || message);
      } catch {
        if (errorBody) message = errorBody;
      }
      logger.warn(
        {
          info: {
            event: "onboarding.uploadContract.failed",
            actor: "smcr-ui",
            subject: "onboarding",
            metadata: { status: response.status, message, id, output },
          },
        },
        "Upload contratto fallito",
      );
      return { success: false, message };
    }

    logger.info(
      {
        info: {
          event: "onboarding.uploadContract.success",
          actor: "smcr-ui",
          subject: "onboarding",
          metadata: { id, output },
        },
      },
      "Upload del contratto avvenuto con successo",
    );
    return {
      success: true,
      message: "Upload del contratto avvenuto con successo!",
    };
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
          event: "onboarding.uploadContract.exception",
          actor: "smcr-ui",
          subject: "onboarding",
          metadata: { id, output },
        },
      },
      "Upload contratto errore",
    );
    return {
      success: false,
      message: "C'è stato un errore nell'upload del contratto",
    };
  }
}
