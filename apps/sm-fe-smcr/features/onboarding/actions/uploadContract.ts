"use server";

import { $fetch } from "@/lib/fetch";
import { OutputOptionsStepFour } from "../components/StepFour";
const UPLOAD = process.env.UPLOAD;
const UPLOAD_UAT = process.env.UPLOAD_UAT;
const ONBOARDING_BASE_PATH = process.env.ONBOARDING_BASE_PATH;
const API_KEY_PROD_GET_IPA = process.env.API_KEY_PROD_GET_IPA;

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

  const endpoint =
    output === "prod"
      ? `${UPLOAD}/${id}/consume`
      : `${UPLOAD_UAT}/${id}/consume`;
  console.log({ endpoint, contract, id, output });

  formData.delete("id");

  try {
    const { data, error } = await $fetch(endpoint, {
      baseURL: output === "prod" ? `${ONBOARDING_BASE_PATH}` : "",
      method: "PUT",
      headers: {
        Accept: "application/problem+json",
        "Ocp-Apim-Subscription-Key": `${API_KEY_PROD_GET_IPA}`,
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
