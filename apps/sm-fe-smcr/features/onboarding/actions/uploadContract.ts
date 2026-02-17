"use server";

import { $fetch } from "@/lib/fetch";
import { OutputOptionsStepFour } from "../components/StepFour";
import {
  FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY,
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

  try {
    const { data, error } = await $fetch(UPLOAD, {
      baseURL:
        output === "prod"
          ? `${ONBOARDING_BASE_PATH}`
          : `${ONBOARDING_BASE_PATH_UAT}`,
      method: "PUT",
      headers: {
        Accept: "application/problem+json",
        "Ocp-Apim-Subscription-Key": `${FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY}`,
      },
      body: formData,
    });
    console.log("DATA", data);

    if (error) {
      return {
        success: false,
        message: error.message || "Upload fallito",
      };
    }

    return {
      success: true,
      message: "Upload del contratto avvenuto con successo!",
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "C'è stato un errore nell'upload del contratto",
    };
  }
}
