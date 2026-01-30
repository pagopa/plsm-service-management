"use server";

import { betterFetch } from "@better-fetch/fetch";
import { z } from "zod";
import { type FirmaConIO, FirmaConIOSchema } from "./firma-con-io.schema";

type GetFirmaConIOResponse =
  | {
      data: FirmaConIO;
      error: null;
    }
  | {
      data: undefined;
      error: "Errore nel recupero dati" | "Nessun ente trovato";
    };

export async function getFirmaConIoInstitution(
  signature_request: string,
  fiscal_code: string,
): Promise<GetFirmaConIOResponse> {
  const { data, error } = await betterFetch(
    `https://api.io.italia.it/api/v1/sign/support/signature-requests/${signature_request}`,
    {
      method: "POST",
      output: FirmaConIOSchema,
      headers: {
        "Ocp-Apim-Subscription-Key": process.env
          .FE_SMCR_API_KEY_FIRMA_CON_IO as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fiscal_code,
      }),
    },
  );

  if (error || !data) {
    console.error(error);
    return { data: undefined, error: "Errore nel recupero dati" };
  }

  if (!data) {
    return { data: undefined, error: "Nessun ente trovato" };
  }

  return { data, error: null };
}

export async function getFirmaConIoSignerID(
  formData: FormData,
): Promise<string | null> {
  const fiscal_code = formData.get("fiscal_code") as string;

  const { data, error } = await betterFetch(
    `https://api.io.pagopa.it/api/v1/sign/signers`,
    {
      method: "POST",
      output: z.object({
        id: z.string(),
      }),
      headers: {
        "Ocp-Apim-Subscription-Key": process.env
          .FE_SMCR_API_KEY_FIRMA_CON_IO_SIGNER_ID as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fiscal_code,
      }),
    },
  );

  if (error || !data) {
    console.error(error);
    return null;
  }

  return data.id;
}
