"use server";

import { serverEnv } from "@/config/env";
import { logServerError } from "../logger/logger.server.helpers";
import {
  ValidationResponse,
  ValidationResult,
} from "@/features/verifica-firma/types";

const ACCEPTED_EXTENSIONS = ["pdf", "p7m"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const SIGNATURE_FN_API_URL = `${serverEnv.SIGNATURE_FN_URL}/api/v1/validate-signature`;

function errorMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "File mancante, vuoto o troppo grande.";
    case 415:
      return "Formato file non supportato. Carica un file .pdf o .p7m.";
    case 422:
      return "Il documento non è stato riconosciuto come file firmato.";
    case 502:
      return "Servizio di validazione momentaneamente non disponibile. Riprova più tardi.";
    default:
      return "Errore durante la verifica della firma.";
  }
}

function hasAllowedExtension(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return !!ext && ACCEPTED_EXTENSIONS.includes(ext);
}

export async function validateSignature(file: File): Promise<ValidationResult> {
  if (!serverEnv.SIGNATURE_FN_URL || !serverEnv.SIGNATURE_FN_KEY) {
    logServerError(
      new Error("SIGNATURE_FN_URL/SIGNATURE_FN_KEY non configurate"),
      "validate-signature - missing configuration",
    );
    return {
      data: null,
      error: "SIGNATURE_FN_URL/SIGNATURE_FN_KEY non configurate",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      data: null,
      error:
        "Il file è troppo grande. La dimensione massima consentita è 20MB.",
    };
  }

  if (!hasAllowedExtension(file.name)) {
    return {
      data: null,
      error: `Formato non supportato. Carica un file ${ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(" o ")}.`,
    };
  }

  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(SIGNATURE_FN_API_URL, {
      method: "POST",
      headers: {
        "x-functions-key": serverEnv.SIGNATURE_FN_KEY,
      },
      body: formData,
    });

    if (!res.ok) {
      return { data: null, error: errorMessageForStatus(res.status) };
    }
    const data = (await res.json()) as ValidationResponse;
    return { data, error: null };
  } catch (error) {
    logServerError(error, "validate-signature - error");
    return { data: null, error: "Errore interno nel proxy" };
  }
}
