"use server";

import { z } from "zod";
import { $fetch } from "@/lib/fetch";
import { TAXCODE_PRIVATE_LENGTH } from "../utils/constants";
const GET_USERS_PATH = process.env.GET_USERS_PATH;

const ONBOARDING_BASE_PATH = process.env.ONBOARDING_BASE_PATH;
const API_KEY_PROD_GET_USERS = process.env.API_KEY_PROD_GET_USERS;

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
        "Ocp-Apim-Subscription-Key": `${API_KEY_PROD_GET_USERS}`,
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
        console.log(error);
        throw new Error();
      }
    }
    console.log(data);
    return { success: true, taxCode, data: data.user };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      taxCode,
      message: "Qualcosa è andato storto",
    };
  }
}
