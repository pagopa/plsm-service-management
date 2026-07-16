import { getCrmErrorMessage } from "../crm-error-messages";

describe("getCrmErrorMessage", () => {
  it("returns the Italian message for a known code", () => {
    expect(getCrmErrorMessage("ACCOUNT_NOT_FOUND")).toBe(
      "Ente non trovato nel CRM. Verifica l'ente selezionato.",
    );
  });

  it("returns the generic fallback for an unknown code", () => {
    expect(getCrmErrorMessage("SOMETHING_NEW")).toBe(
      "Errore CRM. Riprova più tardi o contatta il supporto.",
    );
  });

  it("returns the generic fallback when code is undefined", () => {
    expect(getCrmErrorMessage(undefined)).toBe(
      "Errore CRM. Riprova più tardi o contatta il supporto.",
    );
  });
});
