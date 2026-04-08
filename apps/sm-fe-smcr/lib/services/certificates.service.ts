"use server";

import { betterFetch } from "@better-fetch/fetch";
import { serverEnv } from "@/config/env";
import { CertificatesListSchema, type Certificate } from "./certificates.schema";

const CERTIFICATES_API_URL =
  "https://plsm-p-itn-cert-func-01.azurewebsites.net/api/v1/certificates";

export type GetCertificatesResult =
  | { certificates: Certificate[]; error: null }
  | { certificates: []; error: string };

export async function getCertificates(): Promise<GetCertificatesResult> {
  const apiKey = serverEnv.FE_SMCR_API_KEY_CERTIFICATI;
  if (!apiKey) {
    return {
      certificates: [],
      error: "Chiave API certificati non configurata (FE_SMCR_API_KEY_CERTIFICATI).",
    };
  }

  const { data, error } = await betterFetch(CERTIFICATES_API_URL, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
    output: CertificatesListSchema,
  });

  if (error || !data) {
    console.error("getCertificates:", error);
    return {
      certificates: [],
      error: "Impossibile recuperare l'elenco dei certificati.",
    };
  }

  return { certificates: data, error: null };
}
