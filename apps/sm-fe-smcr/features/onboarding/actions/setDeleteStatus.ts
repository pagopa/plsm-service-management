"use server";

import { betterFetch } from "@better-fetch/fetch";
import {
  FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY,
  FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT,
  ONBOARDING_BASE_PATH,
  ONBOARDING_BASE_PATH_UAT,
  UPLOAD,
} from "./config/env";
import { Environment } from "../utils/constants";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

export async function setDeleteStatus(state: any, formData: FormData) {
  const id = formData.get("id") as string;
  const inputValue = formData.get("inputValue") as string;
  const product = formData.get("product") as string;
  const environment =
    (formData.get("environment") as Environment | null) ?? "prod";

  const isUat = environment === "uat";
  const baseURL = isUat ? ONBOARDING_BASE_PATH_UAT : ONBOARDING_BASE_PATH;
  const subscriptionKey = isUat
    ? FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT
    : FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY;

  const isWhiteSpacesAfterOrBeforeInputValue = inputValue !== inputValue.trim();

  if (!id) {
    return {
      success: false,
      message: "ID mancante",
    };
  }
  if (inputValue !== `${product} DELETE`) {
    return {
      success: false,
      message: `${inputValue} non corrisponde a ${product} DELETE. ${isWhiteSpacesAfterOrBeforeInputValue ? `Non sono ammessi spazi bianchi prima o dopo ${inputValue}.` : ""} `,
    };
  }

  try {
    const { data, error } = await betterFetch(`${baseURL}${UPLOAD}/${id}`, {
      method: "DELETE",
      headers: {
        "Ocp-Apim-Subscription-Key": `${subscriptionKey}`,
      },
    });
    if (error) {
      logServerError(error, "setDeleteStatus - fetch error");
      return {
        success: false,
        message: error.message ?? "Qualcosa è andato storto",
      };
    }
    logServerInfo("setDeleteStatus - onboarding deleted", {
      id,
      environment,
      data,
    });

    return {
      success: true,
    };
  } catch (error) {
    logServerError(error, "setDeleteStatus - unexpected error");
    return {
      success: false,
      message: "Qualcosa è andato storto",
    };
  }
}
