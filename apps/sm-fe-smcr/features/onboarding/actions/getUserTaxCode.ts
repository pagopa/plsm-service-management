"use server";

import { z } from "zod";
import { $fetch } from "@/lib/fetch";
import { TAXCODE_PRIVATE_LENGTH } from "../utils/constants";
import {
  FE_SMCR_API_KEY_PROD_GET_USERS,
  GET_USERS_PATH,
  ONBOARDING_BASE_PATH,
} from "./config/env";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

export async function getUserTaxCode(state: any, formData: FormData) {
  const taxCodeFormData = formData.get("taxCode") as string;
  const taxCode = taxCodeFormData.trim().toUpperCase();
  if (taxCode.length !== TAXCODE_PRIVATE_LENGTH) {
    return {
      success: false,
      taxCode,
      message: `il codice fiscale deve avere ${TAXCODE_PRIVATE_LENGTH} caratteri`,
    };
  }
  try {
    const { data, error } = await $fetch(`${GET_USERS_PATH}`, {
      method: "POST",
      baseURL: ONBOARDING_BASE_PATH,
      headers: {
        "Ocp-Apim-Subscription-Key": `${FE_SMCR_API_KEY_PROD_GET_USERS}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fiscalCode: taxCode,
      }),
      output: z.object({
        user: z.object({
          id: z.string(),
          name: z.string(),
          surname: z.string(),
        }),
      }),
    });

    if (error) {
      if (error.status === 404) {
        return {
          success: false,
          taxCode,
          message: "Utente non trovato",
        };
      } else {
        logServerError(error, "getUserTaxCode - fetch error");
        throw new Error();
      }
    }
    logServerInfo("getUserTaxCode - user retrieved", { taxCode });
    return { success: true, taxCode, data: data.user };
  } catch (error) {
    logServerError(error, "getUserTaxCode - unexpected error");
    return {
      success: false,
      taxCode,
      message: "Qualcosa è andato storto",
    };
  }
}
