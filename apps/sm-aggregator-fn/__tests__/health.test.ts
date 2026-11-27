import type { HttpRequest, InvocationContext } from "@azure/functions";
import { handler } from "../health/handler";

const context = { warn: jest.fn() } as unknown as InvocationContext;
const request = {} as HttpRequest;
const originalEnv = process.env;

describe("health", () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  it("è healthy con la configurazione completa e non espone la chiave", async () => {
    process.env = {
      ...originalEnv,
      SELC_AGGREGATION_INCREMENT_URL: "https://example.test/increment",
      SELC_AGGREGATION_INCREMENT_API_KEY: "chiave-segreta",
      AGGREGATOR_INCREMENT_MODE: "mock",
    };
    const res = await handler(request, context);
    expect(res.status).toBe(200);
    expect(res.jsonBody).toMatchObject({
      status: "healthy",
      incrementMode: "mock",
    });
    expect(JSON.stringify(res.jsonBody)).not.toContain("chiave-segreta");
  });

  it("è degraded ma risponde 200 se manca la configurazione", async () => {
    process.env = {};
    const res = await handler(request, context);
    expect(res.status).toBe(200);
    expect(res.jsonBody).toMatchObject({
      status: "degraded",
      invalidConfig: [],
    });
  });

  it("riporta le variabili non valide senza esporne il valore", async () => {
    process.env = {
      ...originalEnv,
      SELC_AGGREGATION_INCREMENT_URL: "https://example.test/increment",
      SELC_AGGREGATION_INCREMENT_API_KEY: "chiave-segreta",
      AGGREGATOR_INCREMENT_MODE: "prod",
    };
    const res = await handler(request, context);
    expect(res.jsonBody).toMatchObject({
      status: "degraded",
      missingConfig: [],
      invalidConfig: ["AGGREGATOR_INCREMENT_MODE"],
    });
    expect(JSON.stringify(res.jsonBody)).not.toContain("chiave-segreta");
  });
});
