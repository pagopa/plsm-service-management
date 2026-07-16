import { CrmError } from "../errors/CrmError";
import type { CrmErrorInfo } from "../types/dynamics";

/**
 * Codici OData Dynamics che indicano un valore/campo rifiutato dal CRM
 * (schema, optionset, campo inesistente o non valido).
 */
const FIELD_REJECTION_ODATA_CODES = new Set<string>([
  "0x80040265",
  "0x80040217",
  "0x8004431a",
]);

/**
 * Classifica un fallimento CRM in un codice d'errore neutro e stabile.
 *
 * Funzione pura: non conosce HTTP né testi user-facing. Il `rawDetail`
 * dell'eventuale CrmError NON viene mai incluso nell'output.
 *
 * @param params.step - Step del flusso in cui è avvenuto l'errore.
 * @param params.error - Errore risalito (tipicamente un CrmError), opzionale.
 * @returns Informazione d'errore neutra { code, category, step }.
 */
export function mapCrmError(params: {
  step: string;
  error?: unknown;
}): CrmErrorInfo {
  const { step, error } = params;

  if (error instanceof CrmError) {
    if (error.status >= 500 || error.status === 0) {
      return { code: "CRM_UNAVAILABLE", category: "CRM_UNAVAILABLE", step };
    }
    if (error.odataCode && FIELD_REJECTION_ODATA_CODES.has(error.odataCode)) {
      return { code: "CRM_FIELD_REJECTED", category: "CRM_REJECTED", step };
    }
  }

  switch (step) {
    case "verifyAccount":
      return { code: "ACCOUNT_NOT_FOUND", category: "NOT_FOUND", step };
    case "verifyOrCreateContacts":
      return { code: "CONTACT_INVALID", category: "NOT_FOUND", step };
    case "createAppointment":
      return { code: "CRM_ERROR", category: "UNKNOWN", step };
    default:
      return { code: "UNKNOWN", category: "UNKNOWN", step };
  }
}
