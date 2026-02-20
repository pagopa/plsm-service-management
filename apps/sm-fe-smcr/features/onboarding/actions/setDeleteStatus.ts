"use server";

import { $fetch } from "@/lib/fetch";
import { FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY, UPLOAD } from "./config/env";

export async function setDeleteStatus(state: any, formData: FormData) {
  const id = formData.get("id") as string;
  const inputValue = formData.get("inputValue") as string;
  const product = formData.get("product") as string;

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
    const { data, error } = await $fetch(`${UPLOAD}:${id}`, {
      method: "DELETE",
      headers: {
        "Ocp-Apim-Subscription-Key": `${FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY}`,
      },
    });
    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }
    console.log(data);

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Qualcosa è andato storto",
    };
  }
}
