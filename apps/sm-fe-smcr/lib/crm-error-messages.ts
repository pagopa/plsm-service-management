const GENERIC_CRM_ERROR =
  "Errore CRM. Riprova più tardi o contatta il supporto.";

/**
 * Mappa i codici d'errore neutri emessi dalla Azure Function (contratto
 * SMION-800) sui messaggi mostrati all'utente in italiano. Unico punto
 * dell'applicazione in cui i codici CRM diventano testo user-facing.
 */
const CRM_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR:
    "Alcuni dati inseriti non sono validi. Controlla i campi e riprova.",
  ACCOUNT_NOT_FOUND: "Ente non trovato nel CRM. Verifica l'ente selezionato.",
  CONTACT_INVALID:
    "Contatto non valido o non trovato nel CRM. Verifica i partecipanti.",
  CRM_FIELD_REJECTED:
    "Il CRM ha rifiutato uno dei valori inviati. Contatta il supporto.",
  CRM_UNAVAILABLE: "Il CRM non è al momento raggiungibile. Riprova più tardi.",
  CRM_ERROR: GENERIC_CRM_ERROR,
  UNKNOWN: GENERIC_CRM_ERROR,
};

/**
 * Restituisce il messaggio italiano per un codice d'errore CRM, con
 * fallback generico per codici sconosciuti o assenti.
 */
export function getCrmErrorMessage(code?: string): string {
  if (code && Object.prototype.hasOwnProperty.call(CRM_ERROR_MESSAGES, code)) {
    return CRM_ERROR_MESSAGES[code]!;
  }
  return GENERIC_CRM_ERROR;
}
