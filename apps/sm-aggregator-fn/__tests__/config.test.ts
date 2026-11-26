import { ConfigError, loadConfig } from "../_shared/config";

const validEnv = {
  SELC_AGGREGATION_INCREMENT_URL: "https://example.test/increment",
  SELC_AGGREGATION_INCREMENT_API_KEY: "chiave-finta",
};

describe("loadConfig", () => {
  it("usa mock come modalità di default", () => {
    expect(loadConfig(validEnv).incrementMode).toBe("mock");
  });

  it("accetta live", () => {
    expect(
      loadConfig({ ...validEnv, AGGREGATOR_INCREMENT_MODE: "live" }).incrementMode,
    ).toBe("live");
  });

  it("rifiuta una modalità sconosciuta", () => {
    expect(() =>
      loadConfig({ ...validEnv, AGGREGATOR_INCREMENT_MODE: "prod" }),
    ).toThrow(ConfigError);
  });

  it("elenca solo i nomi delle variabili mancanti", () => {
    expect.assertions(2);
    try {
      loadConfig({});
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      expect((error as ConfigError).missing.sort()).toEqual([
        "SELC_AGGREGATION_INCREMENT_API_KEY",
        "SELC_AGGREGATION_INCREMENT_URL",
      ]);
    }
  });
});
