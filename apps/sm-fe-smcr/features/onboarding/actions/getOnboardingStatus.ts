"use server";

import { $fetch } from "@/lib/fetch";
import z from "zod";
import { StatusSchema, statusSchema } from "../types/getFormStatusSchema";
import { getOnboardingStatusSchema } from "../types/getOnboardingStatusSchema";
import { SubunitOption } from "../types/subunitOptionsType";
import { StatusActionState } from "./actionsTypes";

const GET_STATUS = process.env.GET_STATUS;
const ONBOARDING_BASE_PATH = process.env.ONBOARDING_BASE_PATH;
const API_KEY_PROD_GET_INSTITUTION = process.env.API_KEY_PROD_GET_INSTITUTION;

export async function onboardingStatus(
  state: StatusActionState,
  formData: FormData,
): Promise<StatusActionState> {
  console.log("Server Action - FormData entries:");
  formData.forEach((value, key) => console.log(key, value));
  const subunit = formData.get("subunit") as SubunitOption;

  const isSubunit = subunit === "AOO" || subunit === "UO";
  const taxcode = formData.get("taxcode") as string;
  const productId = formData.get("productId") as StatusSchema["productId"];
  const values: StatusSchema = {
    subunit,
    taxcode,
    productId,
    subunitCode: formData.get("subunitCode")?.toString() ?? "",
  };

  try {
    const { error: parseError } = statusSchema.safeParse(values);
    console.log(
      parseError,
      `${GET_STATUS}?taxcode=${values.taxcode}${isSubunit ? `&subunitCode=${values.subunitCode}` : ""}`,
    );
    if (parseError) {
      const errors: StatusActionState["validationErrors"] = {};
      for (const { path, message } of parseError?.issues ?? []) {
        errors[path.join(".")] = { message };
      }
      return {
        apiResponse: undefined,
        formValues: values,
        validationErrors: errors,
      };
    }
  } catch (parseError) {
    console.log(parseError);
    if (parseError instanceof z.ZodError) {
      const errors: StatusActionState["validationErrors"] = {};
      for (const { path, message } of parseError?.issues ?? []) {
        errors[path.join(".")] = { message };
      }
      return {
        apiResponse: undefined,
        formValues: values,
        validationErrors: errors,
      };
    }
  }

  try {
    const { data, error } = await $fetch(
      `${GET_STATUS}?taxcode=${values.taxcode}${isSubunit ? `&subunitCode=${values.subunitCode}` : ""}`,
      {
        method: "GET",
        baseURL: ONBOARDING_BASE_PATH,
        headers: {
          "Ocp-Apim-Subscription-Key": `${API_KEY_PROD_GET_INSTITUTION}`,
        },
        output: getOnboardingStatusSchema,
      },
    );

    if (error) {
      if (error.status === 404) {
        return {
          formValues: values,
          validationErrors: {},
          apiResponse: {
            success: false,
            error: {
              message: "Ente non trovato",
            },
          },
        };
      } else {
        console.log(error);
        return {
          formValues: values,
          validationErrors: {},
          apiResponse: {
            success: false,
            error: {
              message: error.message ?? "Qualcosa è andato storto",
            },
          },
        };
      }
    }

    if (!data) {
      return {
        formValues: values,
        validationErrors: {},
        apiResponse: {
          success: false,
          error: {
            message: "Dati non trovati",
          },
        },
      };
    }
    console.log("DATA: ", data);

    const product = data.find(
      (product) => product.productId === values.productId,
    );

    if (!product) {
      return {
        formValues: values,
        validationErrors: {},
        apiResponse: {
          success: false,
          error: {
            message: `L'ente: ${values.taxcode}${isSubunit ? ` e codice univoco: ${values.subunitCode}` : ""} non ha sottoscritto il prodotto: ${values.productId}`,
          },
        },
      };
    }

    return {
      formValues: values,
      validationErrors: {},
      apiResponse: {
        success: true,
        data: {
          id: product.id,
          status: product.status,
          businessName: product.institution.description,
          message: `Trovato prodotto: ${values.productId} per l'ente: ${values.taxcode}. Stato: ${product.status}
      `,
        },
      },
    };
  } catch (error) {
    console.log(error);
    return {
      formValues: values,
      validationErrors: {},
      apiResponse: {
        success: false,
        error: {
          message: "Errore di validazione dei dati provenienti dall'API",
        },
      },
    };
  }
}
