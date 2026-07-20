export type CrmErrorPayload = {
  code?: string;
  category?: string;
  step?: string;
  fields?: string[];
};

export const CRM_ERROR_FALLBACK_MESSAGE =
  "Errore CRM. Riprova più tardi o contatta il supporto.";

export const CRM_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR:
    "Alcuni dati inseriti non sono validi. Controlla i campi e riprova.",
  ACCOUNT_NOT_FOUND: "Ente non trovato nel CRM. Verifica l'ente selezionato.",
  CONTACT_INVALID:
    "Contatto non valido o non trovato nel CRM. Verifica i partecipanti.",
  CRM_FIELD_REJECTED:
    "Il CRM ha rifiutato uno dei valori inviati. Contatta il supporto.",
  CRM_UNAVAILABLE: "Il CRM non è al momento raggiungibile. Riprova più tardi.",
  CRM_ERROR: CRM_ERROR_FALLBACK_MESSAGE,
  UNKNOWN: CRM_ERROR_FALLBACK_MESSAGE,
};

export function getCrmErrorMessage(code?: string | null): string {
  if (!code) {
    return CRM_ERROR_FALLBACK_MESSAGE;
  }
  return CRM_ERROR_MESSAGES[code] ?? CRM_ERROR_FALLBACK_MESSAGE;
}
