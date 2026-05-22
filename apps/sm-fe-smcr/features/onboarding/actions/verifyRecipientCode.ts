"use server";

import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";
import { FE_SMCR_API_KEY_SUBSCRIPTION_KEY_BILLING_PORTAL } from "./config/env";

const BILLING_PORTAL_BASE_URL =
  "https://api.selfcare.pagopa.it/external/billing-portal/v1/institutions/onboarding/recipientCode/verification";

type VerificationStatus =
  | "ACCEPTED"
  | "DENIED_NO_BILLING"
  | "DENIED_NO_ASSOCIATION";

type VerifyRecipientCodeResult =
  | { success: true }
  | { success: false; code: string; message: string };

export async function verifyRecipientCode({
  originId,
  recipientCode,
}: {
  originId: string;
  recipientCode: string;
}): Promise<VerifyRecipientCodeResult> {
  const baseUrl = BILLING_PORTAL_BASE_URL;
  const url = `${baseUrl}?originId=${encodeURIComponent(originId)}&recipientCode=${encodeURIComponent(recipientCode)}`;
  const apiKey = FE_SMCR_API_KEY_SUBSCRIPTION_KEY_BILLING_PORTAL ?? "";

  logServerInfo("verifyRecipientCode - request", { originId, recipientCode });

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
      },
    });
    if (response.status === 404) {
      return {
        success: false,
        code: "NOT_FOUND",
        message: "Codice SDI non trovato",
      };
    }

    if (!response.ok) {
      logServerError(
        { status: response.status, statusText: response.statusText },
        "verifyRecipientCode - unexpected HTTP error",
      );
      return {
        success: false,
        code: "ERROR",
        message: "Errore durante la verifica del codice SDI",
      };
    }

    const text = await response.text();
    let status: string;
    try {
      const json = JSON.parse(text);
      status =
        typeof json === "string"
          ? json
          : (json.result ?? json.status ?? text.trim());
    } catch {
      status = text.trim().replace(/^"|"$/g, "");
    }

    logServerInfo("verifyRecipientCode - response", { status });

    switch (status as VerificationStatus) {
      case "ACCEPTED":
        return { success: true };
      case "DENIED_NO_BILLING":
        return {
          success: false,
          code: "DENIED_NO_BILLING",
          message:
            "Il codice SDI è associato all'ente ma la fatturazione non è attiva",
        };
      case "DENIED_NO_ASSOCIATION":
        return {
          success: false,
          code: "DENIED_NO_ASSOCIATION",
          message: "Il codice SDI non è associato a questo ente (Origin ID)",
        };
      default:
        logServerError(
          { status },
          "verifyRecipientCode - unknown status response",
        );
        return {
          success: false,
          code: "UNKNOWN",
          message: "Risposta sconosciuta dal servizio di verifica SDI",
        };
    }
  } catch (error) {
    logServerError(error, "verifyRecipientCode - unexpected error");
    return {
      success: false,
      code: "ERROR",
      message: "Errore durante la verifica del codice SDI",
    };
  }
}
