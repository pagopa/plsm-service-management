import { getConfigOrThrow } from "../utils/checkConfig";

describe("getConfigOrThrow", () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("parses a valid configuration", () => {
    process.env.DSS_API_BASE_URL = "http://dss.example:8080";
    process.env.MAX_FILE_SIZE_BYTES = "2048";
    const config = getConfigOrThrow();
    expect(config.dssApiBaseUrl).toBe("http://dss.example:8080");
    expect(config.maxFileSizeBytes).toBe(2048);
  });

  it("defaults maxFileSizeBytes to 10MB when unset", () => {
    process.env.DSS_API_BASE_URL = "http://dss.example:8080";
    delete process.env.MAX_FILE_SIZE_BYTES;
    expect(getConfigOrThrow().maxFileSizeBytes).toBe(10 * 1024 * 1024);
  });

  it("throws when DSS_API_BASE_URL is missing", () => {
    delete process.env.DSS_API_BASE_URL;
    expect(() => getConfigOrThrow()).toThrow(/Configurazione non valida/);
  });
});
