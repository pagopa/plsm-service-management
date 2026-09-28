import { validateOrchestratorRequest } from "../_shared/services/orchestrator";

function baseRequest(overrides: Record<string, unknown> = {}) {
  return {
    institutionIdSelfcare: "22222222-2222-2222-2222-222222222222",
    productIdSelfcare: "prod-pn",
    partecipanti: [{ email: "mario.rossi@example.com" }],
    subject: "Incontro tecnico",
    scheduledstart: "2026-01-15T10:00:00Z",
    scheduledend: "2026-01-15T11:00:00Z",
    ...overrides,
  };
}

describe("validateOrchestratorRequest — validazione link", () => {
  it("accetta la richiesta se link è assente", () => {
    const result = validateOrchestratorRequest(baseRequest());

    expect(result.valid).toBe(true);
  });

  it("accetta un URL valido", () => {
    const result = validateOrchestratorRequest(
      baseRequest({ link: "https://example.com/diario/123" }),
    );

    expect(result.valid).toBe(true);
  });

  it("rifiuta un link che non è una stringa", () => {
    const result = validateOrchestratorRequest(baseRequest({ link: 123 }));

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.fields).toContainEqual(
        expect.objectContaining({ field: "link", code: "invalid_type" }),
      );
    }
  });

  it("rifiuta un link che non è un URL valido", () => {
    const result = validateOrchestratorRequest(
      baseRequest({ link: "non-un-url" }),
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.fields).toContainEqual(
        expect.objectContaining({ field: "link", code: "invalid_value" }),
      );
    }
  });
});
