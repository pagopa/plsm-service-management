import {
  CRM_ERROR_FALLBACK_MESSAGE,
  CRM_ERROR_MESSAGES,
  getCrmErrorMessage,
} from "@/lib/crm-error-messages";

describe("getCrmErrorMessage", () => {
  it("maps a known code to its Italian message", () => {
    expect(getCrmErrorMessage("ACCOUNT_NOT_FOUND")).toBe(
      "Ente non trovato nel CRM. Verifica l'ente selezionato.",
    );
    expect(getCrmErrorMessage("VALIDATION_ERROR")).toBe(
      "Alcuni dati inseriti non sono validi. Controlla i campi e riprova.",
    );
  });

  it("returns the generic fallback for an unknown code", () => {
    expect(getCrmErrorMessage("SOMETHING_NEW")).toBe(
      CRM_ERROR_FALLBACK_MESSAGE,
    );
  });

  it("returns the generic fallback when code is missing", () => {
    expect(getCrmErrorMessage(undefined)).toBe(CRM_ERROR_FALLBACK_MESSAGE);
    expect(getCrmErrorMessage(null)).toBe(CRM_ERROR_FALLBACK_MESSAGE);
    expect(getCrmErrorMessage("")).toBe(CRM_ERROR_FALLBACK_MESSAGE);
  });

  it("covers every catalogued code", () => {
    for (const code of Object.keys(CRM_ERROR_MESSAGES)) {
      expect(getCrmErrorMessage(code)).toBe(CRM_ERROR_MESSAGES[code]);
    }
  });
});
