"use server";

import { betterFetch } from "@better-fetch/fetch";
import logger from "@/lib/logger/logger.server";
import { serverEnv } from "@/config/env";
import {
  CertificatesListSchema,
  type Certificate,
} from "./certificates.schema";

const CERTIFICATES_API_URL =
  "https://plsm-p-itn-cert-func-01.azurewebsites.net/api/v1/certificates";

export type GetCertificatesResult =
  | { certificates: Certificate[]; error: null }
  | { certificates: []; error: string };

export async function getCertificates(): Promise<GetCertificatesResult> {
  const apiKey = serverEnv.FE_SMCR_API_KEY_CERTIFICATI;
  if (!apiKey) {
    logger.warn(
      {
        info: {
          event: "certificates.get.missing_api_key",
          actor: "smcr-ui",
          subject: "getCertificates",
          metadata: {},
        },
      },
      "Chiave API certificati non configurata (FE_SMCR_API_KEY_CERTIFICATI)",
    );
    return {
      certificates: [],
      error:
        "Chiave API certificati non configurata (FE_SMCR_API_KEY_CERTIFICATI).",
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
    const fetchErr = error as
      | { status?: number; message?: string; statusText?: string }
      | undefined;

    logger.error(
      {
        request: {
          method: "GET",
          path: CERTIFICATES_API_URL,
          ...(typeof fetchErr?.status === "number"
            ? { statusCode: fetchErr.status }
            : {}),
        },
        error: fetchErr
          ? {
              name: String(fetchErr.status ?? "FetchError"),
              message: String(fetchErr.message ?? "Errore fetch certificati"),
              stack: fetchErr.statusText,
            }
          : {
              name: "EmptyResponse",
              message: "Risposta certificati vuota o non valida",
            },
        info: {
          event: "certificates.list.error",
          actor: "smcr-ui",
          subject: "getCertificates",
          metadata: {},
        },
      },
      "getCertificates: errore recupero elenco certificati",
    );
    if (error?.status === 403) {
      return {
        certificates: [],
        error: "Accesso negato. Collegersi alla VPN per accedere al servizio.",
      };
    }
    return {
      certificates: [],
      error: "Impossibile recuperare l'elenco dei certificati.",
    };
  }

  return { certificates: data, error: null };
}
